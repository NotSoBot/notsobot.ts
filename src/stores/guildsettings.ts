import { ClusterClient, GatewayClientEvents } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';

import { RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';


export interface GuildSettingsStored {
  icon: null | string,
  id: string,
  name: string,
  prefixes: Array<{
    added: string,
    guild_id: string,
    prefix: string,
    user_id: string,
  }>,
}

// Stores guild settings
class GuildSettings extends Store<string, GuildSettingsStored> {
  constructor() {
    // 2 hours
    super({expire: 2 * (60 * (60 * 1000))});
  }

  insert(payload: GuildSettingsStored): void {
    this.set(payload.id, payload);
  }

  create(cluster: ClusterClient, redis: RedisSpewer) {
    const subscriptions: Array<EventSubscription> = [];
    {
      const subscription = cluster.subscribe('guildDelete', (event: GatewayClientEvents.GuildDelete) => {
        const { guildId } = event;
        this.delete(guildId);
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_SETTINGS_UPDATE, (payload: GuildSettingsStored) => {
        if (this.has(payload.id)) {
          this.insert(payload);
        }
      });
      subscriptions.push(subscription);
    }
    return subscriptions;
  }
}

export default new GuildSettings();



export type GuildSettingsPromise = Promise<GuildSettingsStored | null>;

class GuildSettingsPromises extends Store<string, GuildSettingsPromise> {
  insert(guildId: string, promise: GuildSettingsPromise): void {
    this.set(guildId, promise);
  }
}

export const GuildSettingsPromisesStore = new GuildSettingsPromises();
