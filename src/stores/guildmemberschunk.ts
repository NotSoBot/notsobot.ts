import {
  GatewayClientEvents,
  Collections,
} from 'detritus-client';


export type GuildMembersChunk = GatewayClientEvents.GuildMembersChunk;


class GuildMembersChunkStore extends Collections.BaseCollection<string, GuildMembersChunk | null> {
  constructor() {
    super({expire: 60000});
  }

  insert(key: string, event: GuildMembersChunk | null): void {
    this.set(key, event);
  }
}

export default new GuildMembersChunkStore();
