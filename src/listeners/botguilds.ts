import { ClusterClient, ShardClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription, Timers } from 'detritus-utils';

import { Listener } from './listener';

import { postInfoDiscordGuildsChanges, putInfoDiscordGuilds } from '../api';
import { RedisSpewer } from '../redis';


// Keeps the API's `bot_guilds` table (which guilds the bot is in) up to date, so the website can check
// membership with one database query instead of asking Discord about each guild.
//   - full list per shard right after it connects (READY already holds every guild id), and every few hours
//   - joins/leaves in between, batched

const CHANGES_FLUSH_INTERVAL = 5 * 1000;
const FULL_SYNC_INTERVAL = 6 * 60 * 60 * 1000;
const FULL_SYNC_RETRY_DELAYS = [5 * 1000, 30 * 1000, 2 * 60 * 1000];


class BotGuildsListener extends Listener {
  changesInterval = new Timers.Interval();
  fullSyncInterval = new Timers.Interval();
  // guildId -> latest known state; the last event for a guild wins, so a batch never contradicts itself
  pending = new Map<string, {present: boolean, shardId: number}>();
  flushing = false;

  async syncShard(cluster: ClusterClient, shard: ShardClient): Promise<void> {
    const guildIds = Array.from(shard.guilds.keys());
    for (let attempt = 0; attempt <= FULL_SYNC_RETRY_DELAYS.length; attempt++) {
      try {
        await putInfoDiscordGuilds({client: shard}, {
          guildIds,
          shardCount: cluster.shardCount,
          shardId: shard.shardId,
        });
        return;
      } catch(error) {
        if (attempt === FULL_SYNC_RETRY_DELAYS.length) {
          return;
        }
        await Timers.sleep(FULL_SYNC_RETRY_DELAYS[attempt]);
      }
    }
  }

  async syncReadyShards(cluster: ClusterClient): Promise<void> {
    for (let [shardId, shard] of cluster.shards) {
      if (shard.gateway.state === 'READY') {
        await this.syncShard(cluster, shard);
      }
    }
  }

  async flushChanges(cluster: ClusterClient): Promise<void> {
    const shard = cluster.shards.first();
    if (this.flushing || !this.pending.size || !shard) {
      return;
    }

    this.flushing = true;
    const batch = this.pending;
    this.pending = new Map();

    const added: Array<{guildId: string, shardId: number}> = [];
    const removed: Array<string> = [];
    for (let [guildId, { present, shardId }] of batch) {
      if (present) {
        added.push({guildId, shardId});
      } else {
        removed.push(guildId);
      }
    }

    try {
      await postInfoDiscordGuildsChanges({client: shard}, {added, removed, shardCount: cluster.shardCount});
    } catch(error) {
      // put them back for the next flush, without overwriting anything newer that came in meanwhile
      for (let [guildId, state] of batch) {
        if (!this.pending.has(guildId)) {
          this.pending.set(guildId, state);
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      // fires once READY is processed, when the shard's guild cache already has every guild id
      const subscription = cluster.subscribe(ClientEvents.GATEWAY_READY, ({ shard }) => {
        this.syncShard(cluster, shard);
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_CREATE, ({ fromUnavailable, guild, shard }) => {
        // `fromUnavailable` is the startup/outage flood of guilds we already sent with the full list
        if (!fromUnavailable) {
          this.pending.set(guild.id, {present: true, shardId: shard.shardId});
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = cluster.subscribe(ClientEvents.GUILD_DELETE, ({ guildId, isUnavailable, shard }) => {
        // `isUnavailable` is a Discord outage, not the bot leaving
        if (!isUnavailable) {
          this.pending.set(guildId, {present: false, shardId: shard.shardId});
        }
      });
      subscriptions.push(subscription);
    }

    this.changesInterval.start(CHANGES_FLUSH_INTERVAL, () => this.flushChanges(cluster));
    this.fullSyncInterval.start(FULL_SYNC_INTERVAL, () => this.syncReadyShards(cluster));

    return subscriptions;
  }

  stop(cluster: ClusterClient | ShardClient) {
    this.changesInterval.stop();
    this.fullSyncInterval.stop();
    super.stop(cluster);
  }
}

export default new BotGuildsListener();
