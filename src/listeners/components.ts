import * as fs from 'fs';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';

import { ClusterClient, Collections, ShardClient, Structures } from 'detritus-client';
import {
  ClientEvents,
  InteractionCallbackTypes,
  InteractionTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { getResponseInteractionId } from 'detritus-client/lib/gateway/handlercomponent';
import { ComponentButton, ComponentContext, Components } from 'detritus-client/lib/utils';
import { RequestTypes } from 'detritus-client-rest';
import { EventSubscription, Timers } from 'detritus-utils';

import { deleteFile, fetchFile, fetchFileVanity } from '../api';
import { RestResponsesRaw } from '../api/types';
import { MessageComponentCustomIds, RedisChannels } from '../constants';
import { ApiEventsSpewer } from '../apievents';
import { log } from '../log';
import { RedisPayloads } from '../types';
import { I18n, editOrReply, mediaReplyFromOptions, renderEphemeralDisplay } from '../utils';
import { RawAttachment, disableStaleComponents, isStaticCustomId } from '../utils/stalecomponents';
import { MediaReplyEmbedFooter, createHostedExpiresText } from '../utils/tools';
import {
  deliverUndeliveredGuildReportMessages,
  onGuildReportComponent,
  onGuildReportMessageCreate,
  onGuildReportMuteComponent,
  onGuildReportRespondComponent,
  queueGuildReportUpdate,
} from '../utils/formatter/commands/guild.report';
import { onGuildWarningLogComponent } from '../utils/formatter/commands/moderation.warn';
import { onMusicControl } from '../utils/formatter/commands/music.controls';
import { onAutoEmbedUndo } from '../utils/formatter/commands/tools.download';
import {
  MUSIC_QUEUE_CONTROL,
  findMusicQueueRefresh,
  onMusicQueueRefresh,
  rerenderMusicQueue,
} from '../utils/formatter/commands/music.queue';

import { createTempFilePath, hasTempDiskSpace, removeTempFile } from '../tempfiles';

import { Listener } from './listener';
import { onReportRespondComponent } from './reportmessages';


// our cdn to the bot host, 500 MB takes well under a minute
const REUPLOAD_DOWNLOAD_TIMEOUT = 5 * 60 * 1000;


class ComponentsListener extends Listener {
  // the guild report replies missed while this process was down went out (`catchUpReportReplies`)
  reportRepliesCaughtUp = false;

  // once per process, from the cluster's startup when it's ready (a `.refresh` doesn't run it again)
  catchUpReportReplies(cluster: ClusterClient): void {
    if (this.reportRepliesCaughtUp) {
      return;
    }
    this.reportRepliesCaughtUp = true;
    deliverUndeliveredGuildReportMessages(cluster).catch((error) => {
      log.error('Failed to catch up on guild report replies', error);
    });
  }

  componentsProcessing = new Collections.BaseSet<string>();

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = cluster.subscribe(ClientEvents.INTERACTION_CREATE, async (event) => {
        const { interaction, shard } = event;

        switch (interaction.type) {
          case InteractionTypes.MESSAGE_COMPONENT: {
            const context = new ComponentContext(interaction);
            // read before anything is awaited: the shard runs the press's listener right after this event, a button
            // that ends its listener (a paginator's stop) would look stale afterwards
            const stale = isStalePress(shard, interaction);
            if (context.customId.startsWith(MessageComponentCustomIds.AUTO_EMBED_UNDO + '.')) {
              try {
                // `auto-embed-undo.{userId}.{messageId}`, on an auto-embed
                const [ , userId, messageId ] = context.customId.split('.');
                return await onAutoEmbedUndo(context, userId, messageId);
              } catch(error) {
                log.warn(`auto-embed undo ${context.customId} ${context.guildId}`, error);
              }
            }
            if (context.customId === MessageComponentCustomIds.MAKE_PERMANENT_GALLERY_USING_NITRO) {
              try {
                return await this.makeGalleryPermanentUsingNitro(context);
              } catch(error) {
                log.warn(`gallery reupload ${context.guildId}`, error);
              }
            }
            if (context.customId.startsWith(MessageComponentCustomIds.MAKE_PERMANENT_USING_NITRO)) {
              try {
                const fileId = context.customId.split('.').pop()!;
                return await this.makePermanentUsingNitro(context, fileId);
              } catch(error) {
                
              }
            }
            if (context.customId.startsWith(MessageComponentCustomIds.MUSIC_CONTROLS + '.')) {
              try {
                // `music-controls.{control}`, and the track its page was about after it (`music queue`'s refresh: its
                // page and whose tracks it shows)
                const [ , control, ...rest ] = context.customId.split('.');
                if (control === MUSIC_QUEUE_CONTROL) {
                  return await onMusicQueueRefresh(context, rest[0], rest[1]);
                }
                // on a `music queue` reply the queue shows again, not the track's page
                const queue = (context.interaction.message) ? findMusicQueueRefresh(context.interaction.message) : null;
                const rerender = (queue) ? (ctx: ComponentContext) => rerenderMusicQueue(ctx, queue.page, queue.fromId) : undefined;
                return await onMusicControl(context, control, rest[0], rerender);
              } catch(error) {
                log.warn(`music control ${context.customId} ${context.guildId}`, error);
              }
            }
            if (context.customId.startsWith(MessageComponentCustomIds.GUILD_REPORT + '.')) {
              try {
                // `guild-report.{action}.{reportId}`, on a reports logger's message
                const [ , action, reportId ] = context.customId.split('.');
                return await onGuildReportComponent(context, action, reportId);
              } catch(error) {
                log.warn(`guild report ${context.customId} ${context.guildId}`, error);
              }
            }
            if (context.customId.startsWith(MessageComponentCustomIds.GUILD_WARNING + '.')) {
              try {
                // `guild-warning.{action}.{userId}.{warningId}`, on a moderation logger's warning
                const [ , action, userId, warningId ] = context.customId.split('.');
                return await onGuildWarningLogComponent(context, action, userId, warningId);
              } catch(error) {
                log.warn(`guild warning ${context.customId} ${context.guildId}`, error);
              }
            }
            if (context.customId.startsWith(MessageComponentCustomIds.GUILD_REPORT_RESPOND + '.')) {
              try {
                // `guild-report-respond.{guildId}.{reportId}`, on the reporter's DMs about their server report
                const [ , guildId, reportId ] = context.customId.split('.');
                return await onGuildReportRespondComponent(context, guildId, reportId);
              } catch(error) {
                log.warn(`guild report respond ${context.customId} ${context.userId}`, error);
              }
            }
            if (context.customId.startsWith(MessageComponentCustomIds.GUILD_REPORT_MUTE + '.')) {
              try {
                // `guild-report-mute.{guildId}.{reportId}`, the Stop DMs button on the reporter's DMs
                const [ , guildId, reportId ] = context.customId.split('.');
                return await onGuildReportMuteComponent(context, guildId, reportId);
              } catch(error) {
                log.warn(`guild report mute ${context.customId} ${context.userId}`, error);
              }
            }
            if (context.customId.startsWith(MessageComponentCustomIds.REPORT_RESPOND + '.')) {
              try {
                // `report-respond.{reportId}`, on the DMs about a report to the developers
                const [ , reportId ] = context.customId.split('.');
                return await onReportRespondComponent(context, reportId);
              } catch(error) {
                log.warn(`report respond ${context.customId} ${context.userId}`, error);
              }
            }
            if (stale) {
              try {
                return await this.disableStaleComponents(context, event._raw);
              } catch(error) {
                log.warn(`stale components ${context.customId} ${context.guildId}`, error);
              }
            }
          }; break;
        }
      });
      subscriptions.push(subscription);
    }

    {
      // the dashboard's version of the report buttons above
      const subscription = apiEvents.subscribe(RedisChannels.GUILD_REPORT_UPDATE, (payload: RedisPayloads.GuildReportUpdate) => {
        queueGuildReportUpdate(cluster, payload);
      });
      subscriptions.push(subscription);
    }

    {
      // a reply on a member's report, from either side's Respond button or the dashboard
      const subscription = apiEvents.subscribe(RedisChannels.GUILD_REPORT_MESSAGE_CREATE, (payload: RedisPayloads.GuildReportMessageCreate) => {
        // TODO: remove with the trace in `onGuildReportMessageCreate`
        log.info(`[guild report reply] event ${payload && payload.report && payload.report.id} arrived on cluster ${cluster.clusterId}`);
        onGuildReportMessageCreate(cluster, payload).catch((error) => {
          log.error(`Failed to deliver guild report ${payload.report.id}'s reply ${payload.message.id}`, error);
        });
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }

  // a press nothing listens for anymore: the process restarted before the reply's listener timed out (it takes the
  // buttons off then), or that edit failed. the press used to just fail ("This interaction failed"), now the message is
  // edited with its dead buttons and select menus disabled, everything else on it stays (`disableStaleComponents`)
  async disableStaleComponents(context: ComponentContext, raw: Record<string, any>) {
    const message = raw && raw.message;
    if (!message || !Array.isArray(message.components)) {
      return;
    }
    const isComponentsV2 = ((message.flags || 0) & MessageFlags.IS_COMPONENTS_V2) === MessageFlags.IS_COMPONENTS_V2;
    const attachments: Array<RawAttachment> = (Array.isArray(message.attachments)) ? message.attachments : [];
    const stale = disableStaleComponents(message.components, (isComponentsV2) ? attachments : []);
    if (!stale.disabled) {
      return;
    }
    // discord's own json goes back as it came, detritus passes anything with a `toJSON` through
    const components = {toJSON: () => stale.components as Array<RequestTypes.RawChannelMessageComponent>};

    if (!isComponentsV2) {
      // only the rows are sent, the content, embeds and attachments stay as they are
      return context.respond(InteractionCallbackTypes.UPDATE_MESSAGE, {components});
    }
    const payload = {allowedMentions: {parse: []}, components, flags: MessageFlags.IS_COMPONENTS_V2};
    if (!stale.attachmentIds.length) {
      return context.respond(InteractionCallbackTypes.UPDATE_MESSAGE, payload);
    }

    // its media is attached to it. the attachments stay by their ids, listed so `attachment://` has an entry to resolve
    // against (left out, or as an empty list, the reference isn't found)
    try {
      const kept = attachments.map((attachment) => ({filename: attachment.filename, id: attachment.id}));
      return await context.respond(InteractionCallbackTypes.UPDATE_MESSAGE, {...payload, attachments: kept});
    } catch(error) {
      if (!isBadRequest(error)) {
        throw error;
      }
      // discord refused it, in case it only resolves `attachment://` against files uploaded with the same edit
      // (UNFURLED_MEDIA_ITEM_REFERENCED_ATTACHMENT_NOT_FOUND): they're downloaded and go up again. the refused response
      // didn't use the press up
      log.warn(`stale components ${message.id}: keeping its attachments was refused, uploading them again`, error);
    }

    const referenced = attachments.filter((attachment) => stale.attachmentIds.includes(attachment.id));
    // one press per message at a time, the others are only acknowledged
    const key = `stale.${message.id}`;
    if (this.componentsProcessing.has(key)) {
      return context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
    }
    this.componentsProcessing.add(key);
    const filepaths: Array<string> = [];
    try {
      const clusterId = (context.cluster) ? context.cluster.clusterId : 0;
      await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      const files = await downloadAttachments(context, clusterId, referenced.map((attachment) => {
        return {
          contentType: attachment.content_type,
          description: attachment.description || undefined,
          filename: attachment.filename,
          size: attachment.size,
          title: attachment.title || undefined,
          url: attachment.url,
        };
      }), filepaths);
      // the ones nothing points at stay as they are
      const kept = attachments.filter((attachment) => !stale.attachmentIds.includes(attachment.id)).map((attachment) => {
        return {filename: attachment.filename, id: attachment.id};
      });
      // the press's `@original` is the message the button is on
      await context.editResponse({...payload, attachments: kept, files});
    } finally {
      this.componentsProcessing.delete(key);
      await Promise.all(filepaths.map((filepath) => removeTempFile(filepath)));
    }
  }

  async makePermanentUsingNitro(context: ComponentContext, fileId: string) {
    // cached only, the interaction has to be responded to quickly
    const translator = I18n.getCachedTranslator(context);
    if (this.componentsProcessing.has(context.customId)) {
      // show an error saying that the file is already being re-uploaded
      return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, renderEphemeralDisplay(context, translator, {
        description: translator.translate('media.reupload_in_progress'),
      }));
    }

    // take the lock right away (a second click during the fetch below used to get through), and only the click that
    // took it releases it (an "already in progress" click used to release it, letting a third click re-upload again)
    this.componentsProcessing.add(context.customId);
    try {
      return await this.makePermanentUsingNitroLocked(context, fileId);
    } finally {
      this.componentsProcessing.delete(context.customId);
    }
  }

  async makePermanentUsingNitroLocked(context: ComponentContext, fileId: string) {
    const translator = I18n.getCachedTranslator(context);
    const { translate } = translator;
    let storage: RestResponsesRaw.FileResponseStorage;

    try {
      storage = await fetchFile(context, fileId);
    } catch(error) {
      // if 404, replace entire message maybe?
      return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, renderEphemeralDisplay(context, translator, {
        description: translate('media.reupload_missing'),
      }));
    }

    if (context.maxAttachmentSize < storage.metadata.size) {
      // only allow it if the person who clicked it has enough attachment size to upload it (e.g. nitro)
      return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, renderEphemeralDisplay(context, translator, {
        description: translate('media.reupload_too_big'),
      }));
    }

    // the file is downloaded to disk first (see below), don't fill it up
    const clusterId = (context.cluster) ? context.cluster.clusterId : 0;
    if (!(await hasTempDiskSpace(clusterId, storage.metadata.size))) {
      log.warn(`Not enough disk space to re-upload ${storage.id} (${storage.metadata.size} bytes)`);
      return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, renderEphemeralDisplay(context, translator, {
        description: translate('media.reupload_failed'),
      }));
    }

    if (context.metadata) {
      context.metadata.started = Date.now();
    }

    // its text (like a post's author, caption, site and counts) is only on the reply, read before it's replaced
    const text = findReuploadText(context.interaction.message, storage);

    await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
    await context.createMessage(renderEphemeralDisplay(context, translator, {description: translate('media.reupload_started')}));
    // send a message saying reuploading

    // these go up to 500 MB (nitro), held in memory they'd be copied over and over (the download, the upload) on a host
    // with little memory to spare, so the file goes to disk and is uploaded from there a chunk at a time
    // removed in the `finally`, or by this cluster's next start if the process is killed before it runs
    const filepath = await createTempFilePath(clusterId, 'reupload');
    try {
      const value = await downloadStorageToBlob(context, storage, filepath);

      await mediaReplyFromOptions(context, value, {
        buttons: findKeptButtons(context.interaction.message),
        invokerButton: findKeptInvokerButton(context.interaction.message),
        ...text,
        context,
        extension: storage.metadata.extension,
        filename: storage.filename_safe_base,
        framecount: storage.metadata.framecount,
        height: storage.metadata.height,
        mimetype: storage.metadata.mimetype,
        size: storage.metadata.size,
        storageUserId: storage.user.id,
        width: storage.metadata.width,
      });
    } catch(error) {
      // they were told it started, without this the "re-uploading" message would be the last thing they see
      log.warn(`Failed to re-upload ${storage.id} (${storage.metadata.size} bytes)`, error);
      await context.createMessage(renderEphemeralDisplay(context, translator, {
        description: translate('media.reupload_failed'),
      })).catch(() => {});
      return;
    } finally {
      await removeTempFile(filepath);
    }

    if (storage.temporary) {
      await deleteFile(context, storage.id);
    }
  }

  // a gallery's button: every temporary item hosted on nsb.gg (too big to attach) that fits the clicker's upload limit is
  // downloaded and attached in its place, the rest of the message stays as it was (its text, attachments, the others
  // still hosted). the gallery is found on the message itself, one click per message at a time
  async makeGalleryPermanentUsingNitro(context: ComponentContext) {
    const translator = I18n.getCachedTranslator(context);
    const message = context.interaction.message;
    const key = `${context.customId}.${(message) ? message.id : context.interactionId}`;
    if (this.componentsProcessing.has(key)) {
      return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, renderEphemeralDisplay(context, translator, {
        description: translator.translate('media.reupload_in_progress'),
      }));
    }
    this.componentsProcessing.add(key);
    try {
      return await this.makeGalleryPermanentUsingNitroLocked(context);
    } finally {
      this.componentsProcessing.delete(key);
    }
  }

  async makeGalleryPermanentUsingNitroLocked(context: ComponentContext) {
    const translator = I18n.getCachedTranslator(context);
    const { translate } = translator;
    const respondEphemeral = (description: string) => {
      return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, renderEphemeralDisplay(context, translator, {description}));
    };

    // the layout `mediaReplyFiles` sends: one container with the gallery in it
    const message = context.interaction.message;
    const container = (message) ? message.components.find((x) => x instanceof Structures.ComponentContainer) as Structures.ComponentContainer | undefined : undefined;
    const gallery = (container) ? container.components.find((x) => x instanceof Structures.ComponentMediaGallery) as Structures.ComponentMediaGallery | undefined : undefined;
    if (!message || !container || !gallery) {
      return respondEphemeral(translate('media.reupload_missing'));
    }
    const items = gallery.items.toArray();

    // which of them are hosted, and their files now (an expired or deleted one is left alone)
    const storages: Array<RestResponsesRaw.FileResponseStorage | null> = await Promise.all(items.map(async (item) => {
      const vanity = getHostedVanity(item.media.url);
      if (!vanity) {
        return null;
      }
      try {
        return await fetchFileVanity(context, vanity);
      } catch(error) {
        return null;
      }
    }));
    const temporary = storages.filter((storage): storage is RestResponsesRaw.FileResponseStorage => !!storage && storage.temporary);
    const fits = temporary.filter((storage) => storage.metadata.size <= context.maxAttachmentSize);
    if (!fits.length) {
      return respondEphemeral(translate((temporary.length) ? 'media.reupload_too_big' : 'media.reupload_missing'));
    }

    // the items that are already attached to the message, kept by their ids (see the edit below)
    const findAttachment = (url: string) => {
      const path = urlPath(url);
      return (path) ? message.attachments.find((attachment) => urlPath(attachment.url) === path) : undefined;
    };
    const attached = new Map<string, Structures.Attachment>();
    items.forEach((item, i) => {
      const storage = storages[i];
      const attachment = (storage && fits.includes(storage)) ? undefined : findAttachment(item.media.url);
      if (attachment) {
        attached.set(attachment.id, attachment);
      }
    });
    const reattach = Array.from(attached.values());

    // they're downloaded to disk first (see `downloadStorageToBlob`), don't fill it up
    const clusterId = (context.cluster) ? context.cluster.clusterId : 0;
    const totalSize = fits.reduce((total, storage) => total + storage.metadata.size, 0);
    if (!(await hasTempDiskSpace(clusterId, totalSize))) {
      log.warn(`Not enough disk space to re-upload a gallery (${fits.length} files, ${totalSize} bytes)`);
      return respondEphemeral(translate('media.reupload_failed'));
    }

    await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
    await context.createMessage(renderEphemeralDisplay(context, translator, {description: translate('media.reupload_started')}));

    const filepaths: Array<string> = [];
    try {
      // its attachments keep their names, the new ones get names none of them have
      const usedFilenames = new Set(message.attachments.map((attachment) => attachment.filename.toLowerCase()));
      const uploads = new Map<string, {file: RequestTypes.File, storage: RestResponsesRaw.FileResponseStorage}>();
      // every download settles before the temp files are removed below: one failing rejected `Promise.all` straight
      // away, the rest kept writing files nothing removed anymore (and the lock was let go for another click)
      const downloads = await Promise.allSettled(fits.map(async (storage) => {
        const filepath = await createTempFilePath(clusterId, 'reupload');
        filepaths.push(filepath);
        const value = await downloadStorageToBlob(context, storage, filepath);
        uploads.set(storage.id, {file: {contentType: storage.metadata.mimetype, filename: '', value}, storage});
      }));
      for (let download of downloads) {
        if (download.status === 'rejected') {
          throw download.reason;
        }
      }
      for (let storage of fits) {
        uploads.get(storage.id)!.file.filename = uniqueFilename(storage.filename_safe, usedFilenames);
      }

      // the hosted ones that are left: the ones too big for the clicker, their expiry line and the button stay
      const remaining = items.map((item, i) => {
        const storage = storages[i];
        if (!storage || uploads.has(storage.id)) {
          return {expiresAt: null, number: i + 1, url: ''};
        }
        return {expiresAt: storage.expires_at, number: i + 1, url: storage.urls.cdn};
      });
      const hasRemaining = remaining.some((item) => item.expiresAt);

      const components = new Components();
      const rebuilt = components.createContainer({accentColor: container.accentColor, spoiler: container.spoiler});
      for (let child of container.components.values()) {
        if (child instanceof Structures.ComponentTextDisplay) {
          if (isHostedExpiresText(child.content)) {
            const expires = createHostedExpiresText(context, translator, remaining);
            if (expires) {
              rebuilt.addTextDisplay({content: expires});
            }
          } else {
            rebuilt.addTextDisplay({content: child.content});
          }
        } else if (child instanceof Structures.ComponentSeparator) {
          rebuilt.addSeparator({divider: child.divider, spacing: child.spacing});
        } else if (child instanceof Structures.ComponentMediaGallery) {
          const rebuiltGallery = rebuilt.createMediaGallery();
          items.forEach((item, i) => {
            const storage = storages[i];
            const upload = (storage) ? uploads.get(storage.id) : undefined;
            let url = item.media.url;
            if (upload) {
              url = `attachment://${upload.file.filename}`;
            } else {
              const attachment = findAttachment(item.media.url);
              if (attachment) {
                url = `attachment://${attachment.filename}`;
              }
            }
            rebuiltGallery.addItem({description: item.description, media: {url}, spoiler: item.spoiler});
          });
        } else if (child instanceof Structures.ComponentSection) {
          // the invoked by line with its button (auto-embed's Undo)
          const section = rebuilt.createSection();
          for (let text of child.components.values()) {
            if (text instanceof Structures.ComponentTextDisplay) {
              section.addTextDisplay({content: text.content});
            }
          }
          const button = keptButtonFrom(child.accessory);
          if (button) {
            section.setAccessoryButton(button);
          }
        } else if (child instanceof Structures.ComponentActionRow) {
          // only this button and static ones are ever with a gallery (`mediaReplyFiles` leaves it out next to other rows)
          const buttons = findKeptButtons(message);
          if (hasRemaining) {
            buttons.unshift(new ComponentButton({
              customId: MessageComponentCustomIds.MAKE_PERMANENT_GALLERY_USING_NITRO,
              label: translate('media.make_permanent'),
            }));
          }
          if (buttons.length) {
            const row = rebuilt.createActionRow();
            for (let button of buttons) {
              row.addButton(button);
            }
          }
        } else {
          throw new Error(`Gallery re-upload found an unexpected component (${child.type})`);
        }
      }

      const files = fits.map((storage) => uploads.get(storage.id)!.file);
      try {
        // the ones it has stay by their ids, listed so `attachment://` has an entry to resolve against
        const kept = reattach.map((attachment) => ({filename: attachment.filename, id: attachment.id}));
        await editOrReply(context, {attachments: kept, components, files});
      } catch(error) {
        if (!reattach.length || !isBadRequest(error)) {
          throw error;
        }
        // discord refused it, in case it only resolves `attachment://` against files uploaded with the same edit
        // (UNFURLED_MEDIA_ITEM_REFERENCED_ATTACHMENT_NOT_FOUND): its own files go up again too, `attachments: []`
        // drops the old copies
        log.warn(`gallery reupload ${message.id}: keeping its attachments was refused, uploading them again`, error);
        const reattached = await downloadAttachments(context, clusterId, reattach.map((attachment) => {
          return {
            contentType: attachment.contentType,
            description: attachment.description,
            filename: attachment.filename,
            size: attachment.size,
            title: attachment.title,
            url: attachment.url,
          };
        }), filepaths);
        await editOrReply(context, {attachments: [], components, files: [...reattached, ...files]});
      }
    } catch(error) {
      // they were told it started, without this the "re-uploading" message would be the last thing they see
      log.warn(`Failed to re-upload a gallery (${fits.length} files, ${totalSize} bytes)`, error);
      await context.createMessage(renderEphemeralDisplay(context, translator, {
        description: translate('media.reupload_failed'),
      })).catch(() => {});
      return;
    } finally {
      await Promise.all(filepaths.map((filepath) => removeTempFile(filepath)));
    }

    await Promise.all(fits.map((storage) => deleteFile(context, storage.id).catch(() => {})));
    // some were bigger than their limit, someone else's might fit them
    if (fits.length < temporary.length) {
      await context.createMessage(renderEphemeralDisplay(context, translator, {
        description: translate('media.reupload_too_big'),
      })).catch(() => {});
    }
  }
}

// discord refused the request itself (a 400, like an `attachment://` it couldn't find), not a missing interaction or message
function isBadRequest(error: any): boolean {
  return !!error && !!error.response && error.response.statusCode === 400;
}

// if nothing answers this press: its custom id isn't one the listener above handles, and the shard has no listener for
// the message it's on (the same lookup the shard's handler does, its message key is set before the event is emitted)
function isStalePress(shard: ShardClient, interaction: Structures.Interaction): boolean {
  const { data, message } = interaction;
  const customId = (data && (data as Structures.InteractionDataComponent).customId) || '';
  if (!message || !customId || isStaticCustomId(customId)) {
    return false;
  }
  const { listeners } = shard.gatewayHandler._handlers.component;
  const interactionId = getResponseInteractionId(message);
  return !((interactionId && listeners.has(interactionId)) || listeners.has(message.id));
}

// a file on our cdn (`https://cdn.nsb.gg/{vanity}.{extension}`, not its `assets/`), its vanity for `fetchFileVanity`
// the static buttons a re-upload keeps (auto-embed's Undo), the rebuilt message would leave them out otherwise. they're
// at the top level (embeds/text) or in the components v2 container
const KEPT_BUTTON_CUSTOM_IDS = [MessageComponentCustomIds.AUTO_EMBED_UNDO + '.'];

function findKeptButtons(message?: Structures.Message | null): Array<ComponentButton> {
  const buttons: Array<ComponentButton> = [];
  if (!message) {
    return buttons;
  }
  const fromRow = (row: Structures.ComponentActionRow) => {
    for (let component of row.components.values()) {
      const button = keptButtonFrom(component);
      if (button) {
        buttons.push(button);
      }
    }
  };
  for (let component of message.components.values()) {
    if (component instanceof Structures.ComponentActionRow) {
      fromRow(component);
    } else if (component instanceof Structures.ComponentContainer) {
      for (let child of component.components.values()) {
        if (child instanceof Structures.ComponentActionRow) {
          fromRow(child);
        }
      }
    }
  }
  return buttons;
}

// the one beside the invoked by line in components v2 (a section's accessory), `invokerButton` puts it back there
function findKeptInvokerButton(message?: Structures.Message | null): ComponentButton | undefined {
  const container = (message) ? message.components.find((x) => x instanceof Structures.ComponentContainer) as Structures.ComponentContainer | undefined : undefined;
  if (!container) {
    return undefined;
  }
  for (let child of container.components.values()) {
    if (child instanceof Structures.ComponentSection) {
      const button = keptButtonFrom(child.accessory);
      if (button) {
        return button;
      }
    }
  }
  return undefined;
}

function keptButtonFrom(component: unknown): ComponentButton | null {
  if (!(component instanceof Structures.ComponentButton) || !component.customId) {
    return null;
  }
  const customId = component.customId;
  if (!KEPT_BUTTON_CUSTOM_IDS.some((prefix) => customId.startsWith(prefix))) {
    return null;
  }
  return new ComponentButton({customId, label: component.label || undefined, style: component.style});
}

// what a single hosted file's reply said around it (`createMediaReplyMessage`): a post's text above it, its site and
// counts below, its embed footer, the details line. the re-upload is rendered again from the file alone and left all of
// it out, so it's read back from the reply in whichever display it was sent in
interface ReuploadText {
  altText?: string,
  content?: string,
  description?: string,
  descriptionBelow?: string,
  // the reply's own details line, kept as it was (with how long it took), `hideDetails` when it had none
  details?: string,
  embedFooter?: MediaReplyEmbedFooter,
  hideDetails?: boolean,
  spoiler?: boolean,
}

function findReuploadText(
  message: Structures.Message | null | undefined,
  storage: RestResponsesRaw.FileResponseStorage,
): ReuploadText {
  if (!message) {
    return {};
  }

  // components v2: [content, separator] [description, separator] media [below] separator invoked by, expiry, details
  const container = message.components.find((x) => x instanceof Structures.ComponentContainer) as Structures.ComponentContainer | undefined;
  if (container) {
    const children = container.components.toArray();
    const mediaIndex = children.findIndex((child) => (
      child instanceof Structures.ComponentMediaGallery ||
      // one that can't be in a gallery (like audio) is its link
      (child instanceof Structures.ComponentTextDisplay && child.content === storage.urls.vanity)
    ));
    if (mediaIndex === -1) {
      return {};
    }
    const text: ReuploadText = {};
    const media = children[mediaIndex];
    if (media instanceof Structures.ComponentMediaGallery) {
      const item = media.items.first();
      if (item) {
        text.altText = item.description || undefined;
        text.spoiler = !!item.spoiler;
      }
    }
    const textOf = (child: unknown) => (child instanceof Structures.ComponentTextDisplay) ? child.content : null;
    const above = children.slice(0, mediaIndex).map(textOf).filter((x): x is string => !!x);
    if (1 < above.length) {
      text.content = above[0];
    }
    text.description = above.slice((1 < above.length) ? 1 : 0).join('\n') || undefined;
    let end = mediaIndex + 1;
    while (end < children.length && !(children[end] instanceof Structures.ComponentSeparator)) {
      end++;
    }
    text.descriptionBelow = children.slice(mediaIndex + 1, end).map(textOf).filter(Boolean).join('\n') || undefined;
    // the invoked by and expiry lines are bold, the details line isn't
    const details = children.slice(end + 1).map(textOf).find((x) => !!x && x.startsWith('-# ') && !x.startsWith('-# **'));
    if (details) {
      text.details = details.slice(3);
    } else {
      text.hideDetails = true;
    }
    return text;
  }

  // the embed display: description with the expiry line, the post's site and counts (or the details) in the footer
  const embed = message.embeds.first();
  if (embed && embed.image) {
    const text: ReuploadText = {content: message.content || undefined};
    const lines = (embed.description || '').split('\n').filter((line) => !isHostedExpiresText(line));
    text.description = lines.join('\n') || undefined;
    const footer = embed.footer;
    const timestamp = (embed.timestamp) ? new Date(embed.timestamp).getTime() : undefined;
    if ((footer && footer.iconUrl) || timestamp) {
      // a post's, which never has the details line
      text.embedFooter = {iconUrl: (footer && footer.iconUrl) || undefined, text: (footer && footer.text) || undefined, timestamp};
      text.hideDetails = true;
    } else if (footer && footer.text) {
      text.details = footer.text;
    } else {
      text.hideDetails = true;
    }
    return text;
  }

  // the text display: the description, then the quoted link, invoked by, expiry and details lines
  if (message.content) {
    const lines = message.content.split('\n');
    const vanity = `${storage.urls.vanity}?embed=true`;
    const linkIndex = lines.findIndex((line) => line === `> ${vanity}` || line === `> ||${vanity}||`);
    if (linkIndex === -1) {
      return {};
    }
    const last = lines[lines.length - 1];
    return {
      description: lines.slice(0, linkIndex).join('\n') || undefined,
      // its details line was only how long it took, the re-upload's has the size and dimensions too
      hideDetails: !(linkIndex < lines.length - 1 && !last.startsWith('> -# **')),
      spoiler: lines[linkIndex].includes('||'),
    };
  }
  return {};
}

function getHostedVanity(url: string): null | string {
  const match = /^https:\/\/cdn\.nsb\.gg\/([^/?#]+)\.[^./?#]+(?:[?#]|$)/i.exec(url);
  return (match && match[1] !== 'assets') ? match[1] : null;
}

// the expiry line `createHostedExpiresText` made, it has the hosted ones' download links
function isHostedExpiresText(content: string): boolean {
  return content.includes('cdn.nsb.gg/') && content.includes('?download=true');
}

// a url without its query (discord's attachment urls are signed, the same file's can have different ones)
function urlPath(url: string): null | string {
  try {
    const parsed = new URL(url);
    return parsed.host + parsed.pathname;
  } catch(error) {
    return null;
  }
}

// `name.ext`, or `name-2.ext` and on when it's taken (case insensitive, like discord's attachment names)
function uniqueFilename(filename: string, used: Set<string>): string {
  const dot = filename.lastIndexOf('.');
  const base = (0 < dot) ? filename.slice(0, dot) : filename;
  const extension = (0 < dot) ? filename.slice(dot) : '';
  let unique = filename;
  for (let i = 2; used.has(unique.toLowerCase()); i++) {
    unique = `${base}-${i}${extension}`;
  }
  used.add(unique.toLowerCase());
  return unique;
}

/**
 * A hosted file downloaded to `filepath` and opened as a blob to upload from (they go up to 500 MB with nitro, held in
 * memory they'd be copied over and over on a host with little memory to spare). Never more than the clicker's limit
 */
function downloadStorageToBlob(
  context: ComponentContext,
  storage: RestResponsesRaw.FileResponseStorage,
  filepath: string,
): Promise<Blob> {
  return downloadToBlob(context, storage.urls.cdn, storage.metadata.mimetype, filepath);
}

/**
 * The same for any url (a message's own attachment, to upload it again)
 */
async function downloadToBlob(
  context: ComponentContext,
  url: string,
  mimetype: string | undefined,
  filepath: string,
): Promise<Blob> {
  // one deadline for the whole download, a response that never answers or stalls mid-body would otherwise hold the
  // file (and the button's lock) until the process restarts
  const signal = AbortSignal.timeout(REUPLOAD_DOWNLOAD_TIMEOUT);
  const response = await context.rest.get(url, {dataOnly: false, signal});
  if (!response.body) {
    throw new Error(`Download of ${url.split('?')[0]} got an empty body`);
  }
  await pipeline(
    Readable.fromWeb(response.body),
    // discord would refuse anything bigger anyway, don't let a bad response keep writing to the disk
    limitBytes(context.maxAttachmentSize),
    fs.createWriteStream(filepath),
    {signal},
  );
  return fs.openAsBlob(filepath, {type: mimetype});
}

interface AttachmentDownload {
  contentType?: string,
  description?: string,
  filename: string,
  size: number,
  title?: string,
  url: string,
}

/**
 * A message's own attachments as files to upload again, each downloaded to a temp file whose path is added to
 * `filepaths` (the caller removes them in its `finally`). Throws when one doesn't fit the upload limit there anymore
 * (the server lost its boosts since) or the disk is short
 */
async function downloadAttachments(
  context: ComponentContext,
  clusterId: number,
  attachments: Array<AttachmentDownload>,
  filepaths: Array<string>,
): Promise<Array<RequestTypes.File>> {
  const totalSize = attachments.reduce((total, attachment) => total + attachment.size, 0);
  if (attachments.some((attachment) => context.maxAttachmentSize < attachment.size)) {
    throw new Error(`An attachment is over the upload limit (${attachments.length} files, ${totalSize} bytes)`);
  }
  if (!(await hasTempDiskSpace(clusterId, totalSize))) {
    throw new Error(`Not enough disk space to upload attachments again (${attachments.length} files, ${totalSize} bytes)`);
  }
  // every download settles before the caller removes the temp files
  const downloads = await Promise.allSettled(attachments.map(async (attachment): Promise<RequestTypes.File> => {
    const filepath = await createTempFilePath(clusterId, 'reattach');
    filepaths.push(filepath);
    const value = await downloadToBlob(context, attachment.url, attachment.contentType, filepath);
    return {
      contentType: attachment.contentType,
      description: attachment.description,
      filename: attachment.filename,
      title: attachment.title,
      value,
    };
  }));
  const files: Array<RequestTypes.File> = [];
  for (let download of downloads) {
    if (download.status === 'rejected') {
      throw download.reason;
    }
    files.push(download.value);
  }
  return files;
}

/**
 * Passes the chunks through, erroring once more than `max` bytes went by
 */
function limitBytes(max: number): Transform {
  let total = 0;
  return new Transform({
    transform(chunk: Buffer, encoding, callback) {
      total += chunk.length;
      if (max < total) {
        callback(new Error(`More than ${max} bytes`));
      } else {
        callback(null, chunk);
      }
    },
  });
}


export default new ComponentsListener();
