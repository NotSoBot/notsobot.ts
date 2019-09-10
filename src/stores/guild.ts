import { Collections, Structures } from 'detritus-client';


export interface GuildStorePayload {
  channels: Collections.BaseCollection<string, Structures.Channel> | null,
  emojis: Collections.BaseCollection<string, Structures.Emoji> | null,
  guild?: null | Structures.Guild,
  memberCount: number,
  presenceCount: number,
  voiceStateCount: number,
}

// Stores if we fetched a guild via the rest api or not
class GuildStore extends Collections.BaseCollection<string, GuildStorePayload> {
  constructor() {
    super({expire: (60) * 1000});
  }

  insert(key: string, payload: GuildStorePayload): void {
    this.set(key, payload);
  }
}

export default new GuildStore();
