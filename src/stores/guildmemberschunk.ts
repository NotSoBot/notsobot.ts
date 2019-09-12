import {
  GatewayClientEvents,
  Collections,
} from 'detritus-client';


export type GuildMembersChunkStored = GatewayClientEvents.GuildMembersChunk | null;

class GuildMembersChunkStore extends Collections.BaseCollection<string, GuildMembersChunkStored> {
  constructor() {
    super({expire: (60) * 1000});
  }

  insert(key: string, event: GuildMembersChunkStored): void {
    this.set(key, event);
  }
}

export default new GuildMembersChunkStore();
