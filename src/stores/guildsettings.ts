import { ClusterClient, Command, GatewayClientEvents } from 'detritus-client';
import { EventSubscription } from 'detritus-utils';

import { Store } from './store';

import { putGuildSettings } from '../api';
import { RedisChannels } from '../constants';
import { RedisSpewer } from '../redis';
import { RestOptions, RestResponses } from '../types';


export type GuildSettingsStored = RestResponses.GuildSettings;

// Stores guild settings
class GuildSettings extends Store<string, GuildSettingsStored> {
  constructor() {
    // 2 hours
    super({expire: 2 * (60 * (60 * 1000))});
  }

  insert(payload: GuildSettingsStored): void {
    this.set(payload.id, payload);
  }

  async getOrFetch(context: Command.Context, guildId: string): Promise<GuildSettingsStored | null> {
    let settings: GuildSettingsStored | null = null;
    if (GuildSettingsPromisesStore.has(guildId)) {
      const promise = <GuildSettingsPromise> GuildSettingsPromisesStore.get(guildId);
      settings = await promise;
    } else {
      if (this.has(guildId)) {
        settings = <GuildSettingsStored> this.get(guildId);
      } else {
        const promise: GuildSettingsPromise = new Promise(async (resolve) => {
          const options: RestOptions.PutGuildSettings = {
            icon: null,
            name: '',
          };
          const guild = context.guild;
          if (guild) {
            options.icon = guild.icon;
            options.name = guild.name;
          }
          try {
            const settings: GuildSettingsStored = await putGuildSettings(context, guildId, options);
            this.set(guildId, settings);
            resolve(settings);
          } catch(error) {
            resolve(null);
          }
          GuildSettingsPromisesStore.delete(guildId);
        });
        GuildSettingsPromisesStore.set(guildId, promise);
        settings = await promise;
      }
    }
    return settings;
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
      const subscription = redis.subscribe(RedisChannels.GUILD_BLOCKLIST_UPDATE, (payload: {blocklist: Array<RestResponses.GuildBlocklist>, id: string}) => {
        if (this.has(payload.id)) {
          const settings = <GuildSettingsStored> this.get(payload.id);
          Object.assign(settings, payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_DISABLED_COMMAND_UPDATE, (payload: {disabled_commands: Array<RestResponses.GuildDisabledCommand>, id: string}) => {
        if (this.has(payload.id)) {
          const settings = <GuildSettingsStored> this.get(payload.id);
          Object.assign(settings, payload);
        }
      });
      subscriptions.push(subscription);
    }
    {
      const subscription = redis.subscribe(RedisChannels.GUILD_PREFIX_UPDATE, (payload: {id: string, prefixes: Array<RestResponses.GuildPrefix>}) => {
        if (this.has(payload.id)) {
          const settings = <GuildSettingsStored> this.get(payload.id);
          Object.assign(settings, payload);
        }
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
