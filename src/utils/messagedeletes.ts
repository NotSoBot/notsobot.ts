import { Collections, ShardClient, Structures } from 'detritus-client';
import { Snowflake } from 'detritus-client/lib/utils';


// Our message deletes, one queue per channel. Every path that deletes a message of ours (a trigger's responses, a
// prefix run's leftover "Thinking...", `.undo`, the decoy's cleanup, auto-embed's Undo) used to send its own request
// right away: a trigger deleted along with its extras, a few runs finishing at once or a raid in the decoy channel was a
// burst of single deletes in one channel, and discord's per channel bucket for them answered most of it with 429s. The
// same message was also deleted by more than one path (and after someone else already had), each one a 404
//   - a channel's deletes go out one at a time, so the bucket is never asked more than once at a time
//   - whatever queued up meanwhile goes as one bulk delete when we can (Manage Messages, under 14 days old)
//   - a message that's already gone (deleted by us, a 404, or a delete event while it waited) isn't sent again
// No imports from the rest of the bot on purpose, the stores and listeners use it


// discord refuses a bulk delete with any message over 14 days old in it, a minute's margin for the request itself
export const BULK_DELETE_MAX_AGE = 14 * 24 * 60 * 60 * 1000;
const BULK_DELETE_AGE_MARGIN = 60 * 1000;
// and takes 2 to 100 at a time
const BULK_DELETE_MIN = 2;
const BULK_DELETE_MAX = 100;
// how long a deleted message is remembered, the paths that overlap (a trigger's delete, its run's end, `.undo`) are
// all within the run's few minutes
const GONE_DURATION = 60 * 60 * 1000;

// discord's error for a message that doesn't exist anymore
const ERROR_CODE_UNKNOWN_MESSAGE = 10008;


interface QueuedDelete {
  message: Structures.Message | null,
  messageId: string,
  promise: Promise<boolean>,
  reject: (error: any) => void,
  resolve: (gone: boolean) => void,
  sending: boolean,
}

interface ChannelDeletes {
  client: ShardClient,
  draining: boolean,
  queued: Map<string, QueuedDelete>,
}

interface MessageDeletesState {
  channels: Map<string, ChannelDeletes>,
  gone: Collections.BaseCollection<string, true>,
}

// kept on the process, so a `.refresh` (it reloads this module) doesn't lose the queues still draining
const state: MessageDeletesState = (globalThis as any).notsobotMessageDeletesState = (globalThis as any).notsobotMessageDeletesState || {
  channels: new Map(),
  gone: new Collections.BaseCollection<string, true>({expire: GONE_DURATION}),
};


export function isUnknownMessageError(error: any): boolean {
  return !!error && !!error.response && (error.response.statusCode === 404 || error.code === ERROR_CODE_UNKNOWN_MESSAGE);
}


export function isMessageGone(messageId: string): boolean {
  return state.gone.has(messageId);
}

// a delete event: a queued delete of it is done without a request. only our own messages and queued ones are kept, every
// other delete the bot sees would fill this up for nothing
export function onMessageGone(channelId: string, messageId: string, isOurs: boolean = false): void {
  const deletes = state.channels.get(channelId);
  const queued = (deletes) ? deletes.queued.get(messageId) : undefined;
  if (queued || isOurs) {
    state.gone.set(messageId, true);
  }
  if (deletes && queued && !queued.sending) {
    deletes.queued.delete(messageId);
    queued.resolve(true);
  }
}


function canBulkDelete(client: ShardClient, channelId: string): boolean {
  const channel = client.channels.get(channelId);
  return !!channel && !!channel.guildId && channel.canManageMessages;
}

function isBulkDeletable(messageId: string, now: number): boolean {
  return now - Snowflake.timestamp(messageId) < BULK_DELETE_MAX_AGE - BULK_DELETE_AGE_MARGIN;
}

function isAlreadyGone(queued: QueuedDelete): boolean {
  return state.gone.has(queued.messageId) || (!!queued.message && queued.message.deleted);
}

function settle(deletes: ChannelDeletes, queued: QueuedDelete, error?: any): void {
  if (deletes.queued.get(queued.messageId) === queued) {
    deletes.queued.delete(queued.messageId);
  }
  if (error === undefined || isUnknownMessageError(error)) {
    state.gone.set(queued.messageId, true);
    queued.resolve(true);
  } else {
    queued.reject(error);
  }
}


async function drain(channelId: string, deletes: ChannelDeletes): Promise<void> {
  try {
    while (true) {
      const batch = Array.from(deletes.queued.values()).filter((queued) => !queued.sending).slice(0, BULK_DELETE_MAX);
      if (!batch.length) {
        break;
      }
      for (let queued of batch) {
        queued.sending = true;
      }
      const { client } = deletes;

      let singles = batch.filter((queued) => {
        if (isAlreadyGone(queued)) {
          settle(deletes, queued);
          return false;
        }
        return true;
      });

      const now = Date.now();
      const bulk = singles.filter((queued) => isBulkDeletable(queued.messageId, now));
      if (BULK_DELETE_MIN <= bulk.length && canBulkDelete(client, channelId)) {
        try {
          // ids that don't exist anymore don't fail it, discord skips them
          await client.rest.bulkDeleteMessages(channelId, bulk.map((queued) => queued.messageId));
          for (let queued of bulk) {
            settle(deletes, queued);
          }
          singles = singles.filter((queued) => !bulk.includes(queued));
        } catch(error) {
          // permissions changed, or one of them isn't deletable: they go one by one
        }
      }

      for (let queued of singles) {
        // a delete event may have come in while it waited
        if (isAlreadyGone(queued)) {
          settle(deletes, queued);
          continue;
        }
        try {
          await client.rest.deleteMessage(channelId, queued.messageId);
          settle(deletes, queued);
        } catch(error) {
          settle(deletes, queued, error);
        }
      }
    }
  } finally {
    deletes.draining = false;
    if (Array.from(deletes.queued.values()).some((queued) => !queued.sending)) {
      // one queued while the last request finished, its own drain
      startDrain(channelId, deletes);
    } else if (!deletes.queued.size && state.channels.get(channelId) === deletes) {
      state.channels.delete(channelId);
    }
  }
}

function startDrain(channelId: string, deletes: ChannelDeletes): void {
  if (deletes.draining) {
    return;
  }
  deletes.draining = true;
  // a tick later, so deletes queued together (a loop, a `Promise.all`) go out together
  Promise.resolve().then(() => drain(channelId, deletes)).catch(() => {});
}


// deletes a message in its channel's queue. resolves true once it's gone (deleted now, or it already was), rejects with
// discord's error when it's still there (no permission, discord erroring), a later delete can try it again
export function queueMessageDelete(
  client: ShardClient,
  channelId: string,
  message: Structures.Message | string,
): Promise<boolean> {
  const messageId = (typeof(message) === 'string') ? message : message.id;
  const messageObject = (typeof(message) === 'string') ? null : message;
  if (state.gone.has(messageId) || (messageObject && messageObject.deleted)) {
    return Promise.resolve(true);
  }

  let deletes = state.channels.get(channelId);
  if (!deletes) {
    deletes = {client, draining: false, queued: new Map()};
    state.channels.set(channelId, deletes);
  }
  // a delete of it is already waiting or on its way, the second path gets its answer
  const existing = deletes.queued.get(messageId);
  if (existing) {
    if (!existing.message && messageObject) {
      existing.message = messageObject;
    }
    return existing.promise;
  }

  let resolve!: (gone: boolean) => void;
  let reject!: (error: any) => void;
  const promise = new Promise<boolean>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  deletes.queued.set(messageId, {message: messageObject, messageId, promise, reject, resolve, sending: false});
  startDrain(channelId, deletes);
  return promise;
}

// a message object's own channel and client
export function queueDeleteOf(message: Structures.Message): Promise<boolean> {
  return queueMessageDelete(message.client, message.channelId, message);
}

// for the tests and the owner's debugging
export function getQueuedDeleteCount(channelId?: string): number {
  if (channelId) {
    const deletes = state.channels.get(channelId);
    return (deletes) ? deletes.queued.size : 0;
  }
  let count = 0;
  for (let deletes of state.channels.values()) {
    count += deletes.queued.size;
  }
  return count;
}
