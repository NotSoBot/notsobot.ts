import { GatewayClientEvents } from 'detritus-client';
import { Store } from './store';
export declare type GuildMembersChunkStored = GatewayClientEvents.GuildMembersChunk | null;
declare class GuildMembersChunkStore extends Store<string, GuildMembersChunkStored> {
    constructor();
    insert(key: string, event: GuildMembersChunkStored): void;
}
declare const _default: GuildMembersChunkStore;
export default _default;
