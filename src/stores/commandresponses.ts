import { ClusterClient, Collections, ShardClient } from 'detritus-client';
import { ClientEvents, SocketStates } from 'detritus-client/lib/constants';
import { Snowflake } from 'detritus-client/lib/utils';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';
import { onMessageGone } from '../utils/messagedeletes';


// how long a command's trigger and response are remembered, anything older asks the api like before
export const TRACK_DURATION = 24 * 60 * 60 * 1000;
// discord's clock (the snowflake) and ours can be a bit off
const CLOCK_LEEWAY = 30 * 1000;


// The prefixed commands that got a stored response (what `createUserCommand` saves in the api), so the message delete
// listener and the reply-to-ai check only ask the api about messages it might know something about. Every message sent
// on a shard since we started tracking it went through this process, so a message from then that isn't in here was
// never a trigger (or a response). Messages from before that (a previous process, or before the shard was ready) can't
// be known and still ask the api
// `.refresh` keeps this object (and its state) around, it only swaps the methods
// trigger message id -> response message id
class CommandResponsesStore extends Store<string, string> {
  // response message id -> command id
  responses = new Collections.BaseCollection<string, string>({expire: TRACK_DURATION});
  // response message ids that got deleted, so deleting their trigger later doesn't try deleting them again (detritus
  // drops deleted messages from its cache, so `shard.messages` can't tell us)
  deletedResponses = new Collections.BaseCollection<string, true>({expire: TRACK_DURATION});
  // trigger message id -> more messages its run sent besides its response (each `.ai listen` turn's reply), they go
  // when the trigger does. always in the trigger's channel
  extraResponses = new Collections.BaseCollection<string, Array<string>>({expire: TRACK_DURATION});
  // triggers whose response the api stored with the extras known then, later ones are added to it on their own
  recordedTriggers = new Collections.BaseCollection<string, true>({expire: TRACK_DURATION});
  // response message id -> the NotSoAI response it holds and who asked, prefixed and slash commands both
  llmResponses = new Collections.BaseCollection<string, {id: string, userId: string}>({expire: TRACK_DURATION});
  // shard id -> when we started seeing its messages
  trackingSince = new Map<number, number>();

  constructor() {
    super({expire: TRACK_DURATION});
  }

  insert(triggerId: string, responseId: string, commandId: string): void {
    this.set(triggerId, responseId);
    this.responses.set(responseId, commandId);
  }

  // false when it was already one of the trigger's
  insertExtraResponse(triggerId: string, responseId: string, commandId: string): boolean {
    let responseIds = this.extraResponses.get(triggerId);
    if (responseIds && responseIds.includes(responseId)) {
      return false;
    }
    if (!responseIds) {
      responseIds = [];
    }
    responseIds.push(responseId);
    // set again, so it's remembered for as long as the run keeps sending
    this.extraResponses.set(triggerId, responseIds);
    this.responses.set(responseId, commandId);
    return true;
  }

  getExtraResponses(triggerId: string): Array<string> {
    return (this.extraResponses.get(triggerId) || []).slice();
  }

  // the trigger got deleted, its extras are being deleted now
  takeExtraResponses(triggerId: string): Array<string> {
    const responseIds = this.getExtraResponses(triggerId);
    this.extraResponses.delete(triggerId);
    this.recordedTriggers.delete(triggerId);
    return responseIds;
  }

  // the delete paths overlap (detritus' stored reply, these extras, the api's rows), only the first one to ask deletes it
  claimDeletion(responseId: string): boolean {
    if (this.deletedResponses.has(responseId)) {
      return false;
    }
    this.deletedResponses.set(responseId, true);
    return true;
  }

  // the claimed delete failed and the message is still there (not discord's unknown message), so a later delete path
  // (another `.undo`, the trigger's delete) can try it again
  releaseDeletion(responseId: string): void {
    this.deletedResponses.delete(responseId);
  }

  insertLLMResponse(responseId: string, llmResponseId: string, userId: string): void {
    this.llmResponses.set(responseId, {id: llmResponseId, userId});
  }

  // if the message was sent while we were watching its shard, and recently enough to still be remembered
  isTracked(shard: ShardClient, messageId: string): boolean {
    const since = this.trackingSince.get(shard.shardId);
    if (since === undefined) {
      return false;
    }
    const createdAt = Snowflake.timestamp(messageId);
    return since + CLOCK_LEEWAY <= createdAt && Date.now() - createdAt < TRACK_DURATION - CLOCK_LEEWAY;
  }

  // false only when we know it never triggered a command with a response
  mightBeTrigger(shard: ShardClient, messageId: string): boolean {
    return this.has(messageId) || !this.isTracked(shard, messageId);
  }

  // the id of the command a message of ours is the response to, null if it isn't one, undefined if we can't know
  getResponseCommandId(shard: ShardClient, messageId: string): null | string | undefined {
    if (this.responses.has(messageId)) {
      return this.responses.get(messageId)!;
    }
    return (this.isTracked(shard, messageId)) ? null : undefined;
  }

  // only responses sent while we were tracking, older ones (a previous process) can't be known
  wasResponseDeleted(messageId: string): boolean {
    return this.deletedResponses.has(messageId);
  }

  startTracking(shard: ShardClient): void {
    if (!this.trackingSince.has(shard.shardId)) {
      this.trackingSince.set(shard.shardId, Date.now());
    }
  }

  create(cluster: ClusterClient) {
    const subscriptions: Array<EventSubscription> = [];
    // shards that were already ready when we connected (startup or a `.refresh`, which keeps the old times)
    for (let [shardId, shard] of cluster.shards) {
      if (shard.gateway.state === SocketStates.READY) {
        this.startTracking(shard);
      }
    }
    {
      // fires once READY is processed, any message after it goes through us
      const subscription = cluster.subscribe(ClientEvents.GATEWAY_READY, ({shard}) => {
        this.startTracking(shard);
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_DELETE, ({channelId, message, messageId, shard}) => {
        if (this.responses.has(messageId)) {
          this.deletedResponses.set(messageId, true);
        }
        // a queued delete of it is done, and one of ours isn't deleted again by a later path
        onMessageGone(channelId, messageId, this.responses.has(messageId) || (!!message && message.author.id === shard.userId));
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.MESSAGE_DELETE_BULK, ({channelId, messages, shard}) => {
        for (let [messageId, message] of messages) {
          if (this.responses.has(messageId)) {
            this.deletedResponses.set(messageId, true);
          }
          onMessageGone(channelId, messageId, this.responses.has(messageId) || (!!message && message.author.id === shard.userId));
        }
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new CommandResponsesStore();
