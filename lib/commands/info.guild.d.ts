import { Collections, Command, Structures } from 'detritus-client';
export interface CommandArgs {
    payload: {
        channels: Collections.BaseCollection<string, Structures.Channel>;
        emojis: Collections.BaseCollection<string, Structures.Emoji>;
        guild: Structures.Guild;
        memberCount: number;
        owner: Structures.User;
        presenceCount: number;
        voiceStateCount: number;
    };
}
declare const _default: Command.CommandOptions;
export default _default;
