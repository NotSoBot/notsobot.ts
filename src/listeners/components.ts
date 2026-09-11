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
import { RedisSpewer } from '../redis';
import { mediaReplyFromOptions } from '../utils';

import { Listener } from './listener';


class ComponentsListener extends Listener {
  componentsProcessing = new Collections.BaseSet<string>();

  create(cluster: ClusterClient, redis: RedisSpewer) {
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
                
              } finally {
                this.componentsProcessing.delete(context.customId);
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
    if (this.componentsProcessing.has(context.customId)) {
      // show an error saying that the file is already being re-uploaded
      return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
        content: 'Media is already being re-uploaded currently using someone\'s Nitro.',
        flags: MessageFlags.EPHEMERAL,
      });
    }

    let storage: RestResponsesRaw.FileResponseStorage;

    try {
      storage = await fetchFile(context, fileId);
    } catch(error) {
      // if 404, replace entire message maybe?
      return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
        content: 'Media no longer exists on our servers.',
        flags: MessageFlags.EPHEMERAL,
      });
    }

    if (context.maxAttachmentSize < storage.metadata.size) {
      // only allow it if the person who clicked it has enough attachment size to upload it (e.g. nitro)
      return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
        content: 'You do not have a big enough File Upload Size Limit to re-upload this media.',
        flags: MessageFlags.EPHEMERAL,
      });
    }

    this.componentsProcessing.add(context.customId);

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
      content: 'Using your Nitro Limits to re-upload this media...',
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
