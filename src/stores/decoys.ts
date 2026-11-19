import { ClusterClient, ShardClient } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';

import { fetchDecoys } from '../api';
import { RestResponsesRaw } from '../api/types';
import { RedisChannels } from '../constants';
import { ApiEventsSpewer, ApiEventsSpewerEvents } from '../apievents';
import { log } from '../log';
import { RedisPayloads } from '../types';
import { LoadOnce } from '../utils/loadonce';


// a failed load is tried again on the next message after this long
const RETRY_LOAD_AFTER = 30 * 1000;
// the api's page size for `GET /decoys`
const FETCH_LIMIT = 1000;


/**
 * Every server's decoy channel on this cluster, guild id -> decoy (with its webhook's token). Every message is checked
 * against `channelIds`, so they're all loaded once and kept up to date from `GUILD_DECOY_UPDATE` instead of fetching
 * anything per message. A server has at most one.
 */
class DecoyStore extends Store<string, RestResponsesRaw.GuildDecoy> {
  // channel id -> guild id
  channelIds = new Map<string, string>();
  loader = new LoadOnce<string>(RETRY_LOAD_AFTER);
  // listeners waiting on changes (the bait scheduler), guild id and the decoy now (null: gone)
  updateListeners = new Set<(guildId: string, decoy: RestResponsesRaw.GuildDecoy | null) => void>();
  cluster: ClusterClient | null = null;

  getByChannel(channelId: string): RestResponsesRaw.GuildDecoy | null {
    const guildId = this.channelIds.get(channelId);
    return (guildId) ? this.get(guildId) || null : null;
  }

  isOnCluster(guildId: string): boolean {
    const cluster = this.cluster;
    if (!cluster || !cluster.shardCount) {
      return false;
    }
    const shardId = Number((BigInt(guildId) >> 22n) % BigInt(cluster.shardCount));
    return cluster.shards.has(shardId);
  }

  insert(guildId: string, decoy: RestResponsesRaw.GuildDecoy | null): void {
    const old = this.get(guildId);
    if (old) {
      this.channelIds.delete(old.channel_id);
    }
    if (decoy && this.isOnCluster(guildId)) {
      this.set(guildId, decoy);
      this.channelIds.set(decoy.channel_id, guildId);
    } else {
      this.delete(guildId);
    }
    for (let listener of this.updateListeners) {
      try {
        listener(guildId, this.get(guildId) || null);
      } catch(error) {
        log.error(`Decoy update listener failed for ${guildId}`, error);
      }
    }
  }

  // after a command changed it, so this cluster doesn't wait on the event (the event comes after and sets the same)
  apply(decoy: RestResponsesRaw.GuildDecoy | null, guildId: string): void {
    this.loader.markUpdated(guildId);
    this.insert(guildId, decoy);
  }

  // loaded, or loading it now. Without it every message is let through
  async load(shard?: ShardClient): Promise<boolean> {
    const client = shard || (this.cluster && this.cluster.shards.first());
    if (!client) {
      return false;
    }
    return this.loader.load(async () => {
      const decoys: Array<RestResponsesRaw.GuildDecoy> = [];
      let after: string | undefined;
      while (true) {
        const response = await fetchDecoys({client}, {after, limit: FETCH_LIMIT});
        decoys.push(...response.decoys);
        if (response.decoys.length < FETCH_LIMIT) {
          break;
        }
        after = response.decoys[response.decoys.length - 1].guild_id;
      }
      return decoys;
    }, (decoys, updatedWhileLoading) => {
      const loaded = new Map(decoys.map((decoy) => [decoy.guild_id, decoy]));
      for (let guildId of Array.from(this.keys())) {
        if (!loaded.has(guildId) && !updatedWhileLoading.has(guildId)) {
          this.insert(guildId, null);
        }
      }
      for (let [guildId, decoy] of loaded) {
        if (!updatedWhileLoading.has(guildId) && this.isOnCluster(guildId)) {
          this.insert(guildId, decoy);
        }
      }
    });
  }

  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    this.cluster = cluster;
    subscriptions.push(apiEvents.subscribe(RedisChannels.GUILD_DECOY_UPDATE, (payload: RedisPayloads.GuildDecoyUpdate) => {
      this.loader.markUpdated(payload.guild_id);
      this.insert(payload.guild_id, payload.decoy);
    }));
    subscriptions.push(apiEvents.subscribe(ApiEventsSpewerEvents.RESYNC, () => {
      // missed events, load them all again now (messages keep using the old copy until then)
      this.loader.reset();
      this.load().catch((error) => log.error('Failed to reload decoys', error));
    }));
    this.load().catch((error) => log.error('Failed to load decoys', error));
    return subscriptions;
  }
}

export default new DecoyStore();
