import { CommandClient, InteractionCommandClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription } from 'detritus-utils';

import { deleteCommandsResponses } from './api';
import { connectCommandResults } from './commandresults';
import { connectCommandErrorReporting } from './sentry';


// the command clients' event hooks (their command results, sentry's error reporting, and taking a reply with its deleted
// trigger), here instead of bot.ts so `.refresh` can reload them: it calls `connectCommandHooks` from the reloaded file,
// which removes the old subscriptions first. kept on the client under a global symbol, the reloaded module finds them
const SUBSCRIPTIONS = Symbol.for('notsobot.commandHookSubscriptions');


export function disconnectCommandHooks(client: CommandClient | InteractionCommandClient): void {
  const subscriptions: Array<EventSubscription> | undefined = (client as any)[SUBSCRIPTIONS];
  for (let subscription of subscriptions || []) {
    subscription.remove();
  }
  (client as any)[SUBSCRIPTIONS] = [];
}


export function connectCommandHooks(client: CommandClient | InteractionCommandClient): void {
  disconnectCommandHooks(client);
  const subscriptions: Array<EventSubscription> = [
    ...connectCommandResults(client),
    ...connectCommandErrorReporting(client),
  ];

  if (client instanceof CommandClient) {
    // the trigger message got deleted (or edited into something that isn't a command anymore), take our response with
    // it, detritus already dropped it from the stored replies
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

  (client as any)[SUBSCRIPTIONS] = subscriptions;
}
