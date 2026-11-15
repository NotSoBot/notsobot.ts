import * as fs from 'fs';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';

import { ClusterClient, Collections, ShardClient, Structures } from 'detritus-client';
import {
  ClientEvents,
  InteractionCallbackTypes,
  InteractionTypes,
} from 'detritus-client/lib/constants';
import { ComponentContext } from 'detritus-client/lib/utils';
import { EventSubscription, Timers } from 'detritus-utils';

import { deleteFile, fetchFile } from '../api';
import { RestResponsesRaw } from '../api/types';
import { MessageComponentCustomIds, RedisChannels } from '../constants';
import { ApiEventsSpewer } from '../apievents';
import { log } from '../log';
import { RedisPayloads } from '../types';
import { I18n, mediaReplyFromOptions, renderEphemeralDisplay } from '../utils';
import {
  onGuildReportComponent,
  onGuildReportMessageCreate,
  onGuildReportMuteComponent,
  onGuildReportRespondComponent,
  queueGuildReportUpdate,
} from '../utils/formatter/commands/guild.report';
import { onGuildWarningLogComponent } from '../utils/formatter/commands/moderation.warn';
import { onMusicControl } from '../utils/formatter/commands/music.controls';
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
  componentsProcessing = new Collections.BaseSet<string>();

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = cluster.subscribe(ClientEvents.INTERACTION_CREATE, async (event) => {
        const { interaction, shard } = event;

        switch (interaction.type) {
          case InteractionTypes.MESSAGE_COMPONENT: {
            const context = new ComponentContext(interaction);
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

    let content: string = '';
    let description: string = '';
    let spoiler: boolean = false;
    let took: number = 0;

    // grab content/description from message object
    // grab spoiler from message object
    // grab took from message object?

    await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
    await context.createMessage(renderEphemeralDisplay(context, translator, {description: translate('media.reupload_started')}));
    // send a message saying reuploading

    // these go up to 500 MB (nitro), held in memory they'd be copied over and over (the download, the upload) on a host
    // with little memory to spare, so the file goes to disk and is uploaded from there a chunk at a time
    // removed in the `finally`, or by this cluster's next start if the process is killed before it runs
    const filepath = await createTempFilePath(clusterId, 'reupload');
    try {
      // one deadline for the whole download, a response that never answers or stalls mid-body would otherwise hold the
      // file (and this button's lock) until the process restarts
      const signal = AbortSignal.timeout(REUPLOAD_DOWNLOAD_TIMEOUT);
      const response = await context.rest.get(storage.urls.cdn, {dataOnly: false, signal});
      if (!response.body) {
        throw new Error(`Reupload of ${storage.id} got an empty body`);
      }
      await pipeline(
        Readable.fromWeb(response.body),
        // discord would refuse anything bigger anyway, don't let a bad response keep writing to the disk
        limitBytes(context.maxAttachmentSize),
        fs.createWriteStream(filepath),
        {signal},
      );
      const value = await fs.openAsBlob(filepath, {type: storage.metadata.mimetype});

      await mediaReplyFromOptions(context, value, {
        content,
        context,
        description,
        extension: storage.metadata.extension,
        filename: storage.filename_safe_base,
        framecount: storage.metadata.framecount,
        height: storage.metadata.height,
        mimetype: storage.metadata.mimetype,
        size: storage.metadata.size,
        spoiler,
        storageUserId: storage.user.id,
        took,
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
