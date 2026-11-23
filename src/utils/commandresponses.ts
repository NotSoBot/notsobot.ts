import { Command, ShardClient, Structures } from 'detritus-client';

import { createCommandResponseExtra } from '../api';
import CommandResponsesStore from '../stores/commandresponses';
import { isUnknownMessageError, queueMessageDelete } from './messagedeletes';


// Messages a prefixed command's run sends on top of its reply (`.ai listen` replies to every turn, the reply detritus
// keeps is only the newest), grouped with its trigger: deleting the trigger deletes them too, like its reply. They have
// to be in the trigger's channel. Kept in memory for the delete listeners and stored with the trigger's row in the api
// (sent with it when the run is recorded, `createCommandResponseExtra` for any after that), so they're still found once
// the process forgot them


// what the run is stored under, the same id `onFinally` records it with
export function getCommandId(context: Command.Context): string {
  const command = context.command!;
  return command.metadata.id || command.fullName.split(' ').join('.');
}


export function addExtraResponse(context: Command.Context, message: Structures.Message | string): void {
  const responseId = (typeof(message) === 'string') ? message : message.id;
  const triggerId = context.messageId;
  // the trigger is already gone, it would've taken this with it
  if (context.message.deleted) {
    deleteResponses(context.client, context.channelId, [responseId]).catch(() => {});
    return;
  }
  // the run's own response, already stored with the trigger
  if (CommandResponsesStore.get(triggerId) === responseId) {
    return;
  }
  if (!context.command || !CommandResponsesStore.insertExtraResponse(triggerId, responseId, getCommandId(context))) {
    return;
  }
  // not recorded yet, it's sent along with the run's response then
  if (CommandResponsesStore.recordedTriggers.has(triggerId)) {
    sendExtraResponses(context, [responseId]);
  }
}


// the reply detritus keeps for the trigger is about to be replaced by a new one (the run is sending another message
// instead of editing it), so keep it as an extra: detritus forgets it once it's not the stored one
export function detachReply(context: Command.Context): void {
  const stored = context.commandClient.replies.get(context.messageId);
  context.commandClient.replies.delete(context.messageId);
  if (stored && !stored.reply.deleted) {
    addExtraResponse(context, stored.reply);
  }
}


// `onFinally` stored the run with the extras known when it built the request (`recordedIds`), any added while it was
// being stored are sent now
export function markRecorded(context: Command.Context, recordedIds: Array<string>): void {
  const triggerId = context.messageId;
  CommandResponsesStore.recordedTriggers.set(triggerId, true);
  const missing = CommandResponsesStore.getExtraResponses(triggerId).filter((id) => !recordedIds.includes(id));
  if (missing.length) {
    sendExtraResponses(context, missing);
  }
}


function sendExtraResponses(context: Command.Context, responseIds: Array<string>): void {
  createCommandResponseExtra(context, context.messageId, {
    channelId: context.channelId,
    responseIds,
  }).catch(() => {
    // still deleted with the trigger while this process remembers it
  });
}


// deletes our responses that no other delete path got to first, through their channel's delete queue (together they go
// as one bulk delete when we can). gives the ones still there (their delete failed), they can be tried again
export async function deleteResponses(
  shard: ShardClient,
  channelId: string,
  responseIds: Array<string>,
): Promise<Array<string>> {
  const claimed = responseIds.filter((responseId) => CommandResponsesStore.claimDeletion(responseId));
  const results = await Promise.all(claimed.map(async (responseId) => {
    try {
      await queueMessageDelete(shard, channelId, responseId);
      return null;
    } catch(error) {
      // already deleted is done (the queue resolves those), anything else (no access right now, discord erroring) can
      // be tried again later
      CommandResponsesStore.releaseDeletion(responseId);
      return responseId;
    }
  }));
  return results.filter((responseId): responseId is string => responseId !== null);
}


export { isUnknownMessageError };
