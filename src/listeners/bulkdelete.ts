import { ClusterClient, ShardClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { Snowflake } from 'detritus-client/lib/utils';
import { EventSubscription, Timers } from 'detritus-utils';

import { deleteCommandsResponses, fetchCommandsResponses } from '../api';
import { COMMAND_EDIT_DURATION } from '../constants';
import { ApiEventsSpewer } from '../apievents';
import CommandResponsesStore from '../stores/commandresponses';

import { Listener } from './listener';


class MessageDeleteListener extends Listener {
  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_DELETE_BULK, async (event) => {
        const { channelId, guildId, messages, shard } = event;
        const guild = guildId && shard.guilds.get(guildId);
        const me = guild && guild.me;

        if (me && shard.commandClient) {
          const bulkToDelete: Array<string> = [];

          // purges are mostly messages we know never triggered anything, only ask about the ones that might have
          const triggerIds = Array.from(messages.keys()).filter((messageId) => {
            return CommandResponsesStore.mightBeTrigger(shard, messageId);
          });
          if (!triggerIds.length) {
            return;
          }

          // this runs as a bare event handler, anything thrown here would be an unhandled rejection
          let results: Awaited<ReturnType<typeof fetchCommandsResponses>>['results'];
          try {
            ({ results } = await fetchCommandsResponses({client: shard}, {channelId, triggerIds}));
          } catch(error) {
            return;
          }

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
                // one failed chunk (already deleted, too old for bulk delete, etc) shouldn't stop the rest
                try {
                  if (messageIds.length === 1) {
                    await shard.rest.deleteMessage(channelId, messageIds[0]);
                  } else {
                    await shard.rest.bulkDeleteMessages(channelId, messageIds);
                  }
                } catch(error) {

                }
              }
            } else {
              for (let messageId of bulkToDelete) {
                try {
                  await shard.rest.deleteMessage(channelId, messageId);
                } catch(error) {

                }
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

    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_DELETE, async (event) => {
        const { channelId, message, messageId, shard } = event;
        // newer triggers still have their reply in the command client's memory, the COMMAND_DELETE handler covers those
        if (Date.now() - Snowflake.timestamp(messageId) < COMMAND_EDIT_DURATION) {
          return;
        }
        // bots (us included) can't trigger commands
        if (message && message.author.bot) {
          return;
        }
        // nearly every delete on the bot isn't a command, only ask the api when it could have a stored response
        if (!CommandResponsesStore.mightBeTrigger(shard, messageId)) {
          return;
        }

        let results: Awaited<ReturnType<typeof fetchCommandsResponses>>['results'];
        try {
          ({ results } = await fetchCommandsResponses({client: shard}, {channelId, triggerIds: [messageId]}));
        } catch(error) {
          return;
        }
        if (!results.length) {
          return;
        }

        for (let result of results) {
          const response = shard.messages.get(result.message_response_id);
          if (response && response.deleted) {
            continue;
          }
          try {
            await shard.rest.deleteMessage(channelId, result.message_response_id);
          } catch(error) {
            // already deleted (an edit within the window may have stored it in memory too)
          }
        }

        try {
          await deleteCommandsResponses({client: shard}, {channelId, triggerIds: [messageId]});
        } catch(error) {
          // the stale cleanup will get them eventually
        }
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new MessageDeleteListener();
