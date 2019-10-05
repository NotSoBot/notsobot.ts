import { Collections, Constants, GatewayClientEvents, Structures } from 'detritus-client';
const { ClientEvents } = Constants;

import { Store } from './store';


export type GuildChannelsStored = Collections.BaseCollection<string, Structures.Channel> | null;

// Stores if we fetched a guild via the rest api or not
class GuildChannelsStore extends Store<string, GuildChannelsStored> {
  constructor() {
    super({expire: (2 * 60) * 1000});
  }

  insert(key: string, payload: GuildChannelsStored): void {
    this.set(key, payload);
  }

  create() {
    this.listeners[ClientEvents.GUILD_DELETE] = async (event: GatewayClientEvents.GuildDelete) => {
      const { guildId } = event;

      this.delete(guildId);
    };
  }
}

export default new GuildChannelsStore();
