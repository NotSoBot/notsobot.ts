import { Collections, Constants, GatewayClientEvents, Structures } from 'detritus-client';
const { ClientEvents } = Constants;

import { Store } from './store';


export interface GuildMetadataStored {
  emojis: Collections.BaseCollection<string, Structures.Emoji> | null,
  guild?: null | Structures.Guild,
  memberCount: number,
  owner: null | Structures.User,
  presenceCount: number,
  voiceStateCount: number,
}

// Stores rest-fetched guilds
class GuildMetadataStore extends Store<string, GuildMetadataStored> {
  constructor() {
    super({expire: (2 * 60) * 1000});
  }

  insert(key: string, payload: GuildMetadataStored): void {
    this.set(key, payload);
  }

  create() {
    this.listeners[ClientEvents.GUILD_DELETE] = async (event: GatewayClientEvents.GuildDelete) => {
      const { guildId } = event;

      this.delete(guildId);
    };
  }
}

export default new GuildMetadataStore();
