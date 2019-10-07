import { Command, Structures } from 'detritus-client';
import { GuildChannelsStored } from '../stores/guildchannels';
export interface CommandArgs {
    payload: {
        channel: Structures.Channel;
        channels: GuildChannelsStored;
    };
}
declare const _default: Command.CommandOptions;
export default _default;
