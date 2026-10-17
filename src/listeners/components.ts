import { ClusterClient, Collections, ShardClient, Structures } from 'detritus-client';
import {
  ClientEvents,
  InteractionCallbackTypes,
  InteractionTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { ComponentContext } from 'detritus-client/lib/utils';
import { EventSubscription, Timers } from 'detritus-utils';

import { deleteFile, fetchFile } from '../api';
import { RestResponsesRaw } from '../api/types';
import { MessageComponentCustomIds } from '../constants';
import { ApiEventsSpewer } from '../apievents';
import { I18n, mediaReplyFromOptions } from '../utils';

import { Listener } from './listener';


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
          }; break;
        }
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }

  async makePermanentUsingNitro(context: ComponentContext, fileId: string) {
    // cached only, the interaction has to be responded to quickly
    const { translate } = I18n.getCachedTranslator(context);
    if (this.componentsProcessing.has(context.customId)) {
      // show an error saying that the file is already being re-uploaded
      return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
        content: translate('media.reupload_in_progress'),
        flags: MessageFlags.EPHEMERAL,
      });
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
    const { translate } = I18n.getCachedTranslator(context);
    let storage: RestResponsesRaw.FileResponseStorage;

    try {
      storage = await fetchFile(context, fileId);
    } catch(error) {
      // if 404, replace entire message maybe?
      return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
        content: translate('media.reupload_missing'),
        flags: MessageFlags.EPHEMERAL,
      });
    }

    if (context.maxAttachmentSize < storage.metadata.size) {
      // only allow it if the person who clicked it has enough attachment size to upload it (e.g. nitro)
      return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
        content: translate('media.reupload_too_big'),
        flags: MessageFlags.EPHEMERAL,
      });
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
    await context.createMessage({
      content: translate('media.reupload_started'),
      flags: MessageFlags.EPHEMERAL,
    });
    // send a message saying reuploading

    const buffer = await context.rest.get(storage.urls.cdn);
    await mediaReplyFromOptions(context, buffer, {
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

    if (storage.temporary) {
      await deleteFile(context, storage.id);
    }
  }
}

export default new ComponentsListener();
