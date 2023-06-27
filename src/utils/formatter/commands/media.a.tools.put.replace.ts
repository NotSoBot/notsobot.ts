import { Command, Interaction } from 'detritus-client';

import { audioToolsPutReplace } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.a.tools.put.replace';

export interface CommandArgs {
  longest?: boolean,
  noloop?: boolean,
  urls: Array<string>,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await audioToolsPutReplace(context, args);
  return mediaReply(context, response);
}
