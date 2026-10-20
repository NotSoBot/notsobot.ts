import { ClusterClient, Collections, ShardClient } from 'detritus-client';
import { ClientEvents, SocketStates } from 'detritus-client/lib/constants';
import { Snowflake } from 'detritus-client/lib/utils';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';


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
  // shard id -> when we started seeing its messages
  trackingSince = new Map<number, number>();

  constructor() {
    super({expire: TRACK_DURATION});
  }

  insert(triggerId: string, responseId: string, commandId: string): void {
    this.set(triggerId, responseId);
    this.responses.set(responseId, commandId);
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
    return subscriptions;
  }
}

export default new CommandResponsesStore();
