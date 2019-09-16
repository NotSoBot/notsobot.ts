import { Collections, Structures } from 'detritus-client';


export type GuildChannelsStored = Collections.BaseCollection<string, Structures.Channel> | null;

// Stores if we fetched a guild via the rest api or not
class GuildChannelsStore extends Collections.BaseCollection<string, GuildChannelsStored> {
  constructor() {
    super({expire: (2 * 60) * 1000});
  }

  insert(key: string, payload: GuildChannelsStored): void {
    this.set(key, payload);
  }
}

export default new GuildChannelsStore();
