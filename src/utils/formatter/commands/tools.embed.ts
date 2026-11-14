import { Command, Interaction } from 'detritus-client';

import * as ToolsDownload from './tools.download';


export const COMMAND_ID = 'tools.embed';


export type CommandArgs = ToolsDownload.CommandArgs;

// `download` with the post's author and text above the media, like a link preview (and like a server's auto-embed with
// its text on). links whose site gave no text are just the media, like `download`
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return ToolsDownload.createMessage(context, args, {post: true});
}
