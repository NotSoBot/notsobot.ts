import { Command } from 'detritus-client';
export interface CommandArgs {
    code: string;
    jsonspacing: number;
    noembed: boolean;
    noreply: boolean;
    upload: boolean;
}
declare const _default: Command.CommandOptions;
export default _default;
