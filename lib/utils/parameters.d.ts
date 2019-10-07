import { Command, Structures } from 'detritus-client';
import { GuildChannelsStored } from '../stores/guildchannels';
import { GuildMetadataStored } from '../stores/guildmetadata';
import { MemberOrUser } from '../stores/memberoruser';
export declare function applications(value: string, context: Command.Context): Promise<Array<Structures.Application> | undefined>;
export declare function channel(value: string, context: Command.Context): Promise<null | Structures.Channel | undefined>;
export interface ChannelMetadata {
    channel?: Structures.Channel | null;
    channels: GuildChannelsStored;
}
export declare function channelMetadata(value: string, context: Command.Context): Promise<ChannelMetadata>;
export interface GuildMetadata extends GuildMetadataStored {
    channels: GuildChannelsStored;
}
export declare function guildMetadata(value: string, context: Command.Context): Promise<GuildMetadata>;
export declare function lastImageUrl(value: string, context: Command.Context): Promise<null | string | undefined>;
export declare function lastImageUrls(value: string, context: Command.Context): Promise<Array<string> | null>;
export declare function memberOrUser(value: string, context: Command.Context): Promise<MemberOrUser>;
export declare function percentage(value: string, context: Command.Context): number;
