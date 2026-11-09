import { Command, Interaction } from 'detritus-client';

import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'tools.url';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // just the url so it's easy to copy, discord previews the media under it
  return editOrReply(context, {content: args.url, allowedMentions: {parse: []}});
}
