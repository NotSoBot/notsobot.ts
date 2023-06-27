import { Command, Interaction } from 'detritus-client';

import { audioToolsPutConcat } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.a.tools.put.concat';

export interface CommandArgs {
  longest?: boolean,
  noloop?: boolean,
  urls: Array<string>,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await audioToolsPutConcat(context, args);
  return mediaReply(context, response);
}
