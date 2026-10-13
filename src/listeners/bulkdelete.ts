import { ClusterClient, ShardClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription, Timers } from 'detritus-utils';

import { deleteCommandsResponses, fetchCommandsResponses } from '../api';
import { RedisSpewer } from '../redis';

import { Listener } from './listener';


class MessageDeleteListener extends Listener {
  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_DELETE_BULK, async (event) => {
        const { channelId, guildId, messages, shard } = event;
        const guild = guildId && shard.guilds.get(guildId);
        const me = guild && guild.me;

        if (me && shard.commandClient) {
          const bulkToDelete = [];

          const { count, results } = await fetchCommandsResponses({client: shard}, {
            channelId,
            triggerIds: Array.from(messages.keys()),
          });

          for (let result of results) {
            const message = shard.messages.get(result.message_response_id);
            if (!message || !message.deleted) {
              bulkToDelete.push(result.message_response_id);
            }
          }

          /*
          for (let [messageId, message] of messages) {
            const lastReply = shard.commandClient.replies.get(messageId);
            if (lastReply && !lastReply.reply.deleted) {
              bulkToDelete.push(lastReply.reply.id);
            }
          }
          */

          // i think discord only sends up to 100 message ids at a time?
          if (bulkToDelete.length) {
            if (me.canManageMessages) {
              for (let i = 0; i < bulkToDelete.length; i += 100) {
                const messageIds = bulkToDelete.slice(i, i + 100);
                if (messageIds.length === 1) {
                  await shard.rest.deleteMessage(channelId, messageIds[0]);
                } else {
                  await shard.rest.bulkDeleteMessages(channelId, messageIds);
                }
              }
            } else {
              for (let messageId of bulkToDelete) {
                await shard.rest.deleteMessage(channelId, messageId);
              }
            }
          }

          // the responses are gone now, stop storing them
          if (results.length) {
            const triggerIds = results.map((result) => result.message_trigger_id);
            for (let i = 0; i < triggerIds.length; i += 100) {
              try {
                await deleteCommandsResponses({client: shard}, {channelId, triggerIds: triggerIds.slice(i, i + 100)});
              } catch(error) {
                // the stale cleanup will get them eventually
              }
            }
          }
        }
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new MessageDeleteListener();
