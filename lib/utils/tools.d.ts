import { Collections, Command, Structures } from 'detritus-client';
import { GuildMembersChunkStored } from '../stores/guildmemberschunk';
export declare function chunkMembers(context: Command.Context, options?: {
    limit?: number;
    presences?: boolean;
    query?: string;
    timeout?: number;
    userIds?: Array<string>;
}): Promise<GuildMembersChunkStored>;
export declare function findImageUrlInMessages(messages: Collections.BaseCollection<string, Structures.Message> | Array<Structures.Message>): null | string;
export declare function findMemberByChunk(context: Command.Context, username: string, discriminator?: null | string): Promise<Structures.Member | Structures.User | null>;
export interface FindMemberByUsernameCache {
    values(): IterableIterator<Structures.Member | Structures.User | undefined>;
}
export declare function findMemberByUsername(members: FindMemberByUsernameCache, username: string, discriminator?: null | string): Structures.Member | Structures.User | undefined;
export declare function findMembersByUsername(members: FindMemberByUsernameCache, username: string, discriminator?: null | string): Array<Structures.Member | Structures.User>;
export declare function formatMemory(bytes: number, decimals?: number): string;
export interface FormatTimeOptions {
    day?: boolean;
    ms?: boolean;
}
export declare function formatTime(ms: number, options?: FormatTimeOptions): string;
export declare function isSnowflake(value: string): boolean;
export declare function padCodeBlockFromColumns(strings: Array<Array<string>>, options?: {
    join?: string;
    padding?: string;
    padFunc?: (targetLength: number, padString?: string) => string;
}): Array<string>;
export declare function padCodeBlockFromRows(strings: Array<Array<string>>, options?: {
    join?: string;
    padding?: string;
    padFunc?: (targetLength: number, padString?: string) => string;
}): Array<string>;
export declare function toCodePoint(unicodeSurrogates: string, separator?: string): string;
export declare function toTitleCase(value: string): string;
export declare function onRunError(context: Command.Context, args: {
    [key: string]: any;
} | any, error: any): Promise<Structures.Message>;
export declare function onTypeError(context: Command.Context, args: {
    [key: string]: any;
} | any, errors: {
    [key: string]: Error;
} | any): Promise<Structures.Message>;
