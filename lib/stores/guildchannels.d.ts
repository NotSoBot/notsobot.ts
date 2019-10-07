import { Collections, Structures } from 'detritus-client';
import { Store } from './store';
export declare type GuildChannelsStored = Collections.BaseCollection<string, Structures.Channel> | null;
declare class GuildChannelsStore extends Store<string, GuildChannelsStored> {
    constructor();
    insert(key: string, payload: GuildChannelsStored): void;
    create(): void;
}
declare const _default: GuildChannelsStore;
export default _default;
