import {
  GatewayClientEvents,
  Collections,
} from 'detritus-client';


export type GuildMembersChunk = GatewayClientEvents.GuildMembersChunk;

export type GuildMembersChunkItem = {
  event: GuildMembersChunk | null,
  expire: any,
};


class GuildMembersChunkStore extends Collections.BaseCollection<string, GuildMembersChunkItem, GuildMembersChunk | null> {
  insert(
    key: string,
    event: GuildMembersChunk | null,
    timeout: number = 60000,
  ): void {
    if (this.has(key)) {
      this.delete(key);
    }

    this.set(key, {
      event,
      expire: setTimeout(() => this.delete(key), timeout),
    });
  }

  delete(key: string): boolean {
    if (this.has(key)) {
      const item = <GuildMembersChunkItem> super.get(key);
      if (item.expire !== null) {
        clearTimeout(item.expire);
        item.expire = null;
      }
    }
    return super.delete(key);
  }

  get(key: string): GuildMembersChunk | null | undefined {
    if (this.has(key)) {
      const item = <GuildMembersChunkItem> super.get(key);
      return item.event;
    }
  }

  clear(): void {
    for (let [key, item] of this) {
      if (item.expire !== null) {
        clearTimeout(item.expire);
        item.expire = null;
      }
    }
    return super.clear();
  }
}

export default new GuildMembersChunkStore();
