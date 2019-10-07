import { Collections, Structures } from 'detritus-client';
import { Store } from './store';
export interface GuildMetadataStored {
    emojis: Collections.BaseCollection<string, Structures.Emoji> | null;
    guild?: null | Structures.Guild;
    memberCount: number;
    owner: null | Structures.User;
    presenceCount: number;
    voiceStateCount: number;
}
declare class GuildMetadataStore extends Store<string, GuildMetadataStored> {
    constructor();
    insert(key: string, payload: GuildMetadataStored): void;
    create(): void;
}
declare const _default: GuildMetadataStore;
export default _default;
