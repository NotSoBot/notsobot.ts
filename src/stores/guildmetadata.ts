import { Collections, Structures } from 'detritus-client';


export interface GuildMetadataStored {
  emojis: Collections.BaseCollection<string, Structures.Emoji> | null,
  guild?: null | Structures.Guild,
  memberCount: number,
  owner: null | Structures.User,
  presenceCount: number,
  voiceStateCount: number,
}

// Stores rest-fetched guilds
class GuildMetadataStore extends Collections.BaseCollection<string, GuildMetadataStored> {
  constructor() {
    super({expire: (2 * 60) * 1000});
  }

  insert(key: string, payload: GuildMetadataStored): void {
    this.set(key, payload);
  }
}

export default new GuildMetadataStore();
