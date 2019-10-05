import { GatewayClientEvents } from 'detritus-client';

import { Store } from './store';


export type GuildMembersChunkStored = GatewayClientEvents.GuildMembersChunk | null;

class GuildMembersChunkStore extends Store<string, GuildMembersChunkStored> {
  constructor() {
    super({expire: (60) * 1000});
  }

  insert(key: string, event: GuildMembersChunkStored): void {
    this.set(key, event);
  }
}

export default new GuildMembersChunkStore();
