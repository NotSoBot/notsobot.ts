import { ClusterClient, CommandClient, InteractionCommandClient, ShardClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription } from 'detritus-utils';

import { Listener } from './listener';

import { deleteCommandsResponses } from '../api';
import { ApiEventsSpewer } from '../apievents';
import { connectCommandResults } from '../commandresults';
import { connectCommandErrorReporting } from '../sentry';


// the command clients' own events: their command results, sentry's error reporting, and taking a reply with its deleted
// trigger. `connectAllListeners` runs before the clients exist (this subscribes to nothing then), bot.ts connects it
// again once they're made, and `.refresh` reloads it like every other listener
class CommandHooksListener extends Listener {
  create(cluster: ClusterClient | ShardClient, apiEvents: ApiEventsSpewer): Array<EventSubscription> {
    const subscriptions: Array<EventSubscription> = [];
    const clients = [
      (cluster as ClusterClient).commandClient,
      (cluster as ClusterClient).interactionCommandClient,
    ] as Array<CommandClient | InteractionCommandClient | null | undefined>;
    for (let client of clients) {
      if (!client) {
        continue;
      }
      subscriptions.push(...connectCommandResults(client), ...connectCommandErrorReporting(client));

      if (client instanceof CommandClient) {
        // the trigger message got deleted (or edited into something that isn't a command anymore), take our response
        // with it, detritus already dropped it from the stored replies
        subscriptions.push(client.subscribe(ClientEvents.COMMAND_DELETE, async ({context, event, reply}) => {
          // purges are handled by the MESSAGE_DELETE_BULK listener, it bulk deletes every response (any age) at once
          if (event === ClientEvents.MESSAGE_DELETE_BULK) {
            return;
          }
          if (reply && !reply.deleted) {
            try {
              await reply.delete();
            } catch(error) {

            }
          }
          try {
            await deleteCommandsResponses(context, {channelId: context.channelId, triggerIds: [context.messageId]});
          } catch(error) {
            // the stale cleanup will get them eventually
          }
        }));
      }
    }
    return subscriptions;
  }

  // once the command clients exist, startup connected it before them
  reconnect(cluster: ClusterClient): void {
    this.stop(cluster);
    this.connect(cluster);
  }
}

export default new CommandHooksListener();
