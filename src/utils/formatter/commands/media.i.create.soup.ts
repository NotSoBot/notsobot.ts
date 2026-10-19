import { Command, Interaction } from 'detritus-client';

import { mediaICreateSoup } from '../../../api';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.soup';
export const MAX_TEXT_LENGTH = 14;

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaICreateSoup(context, {
    safe: DefaultParameters.safe(context),
    text: args.text,
  });
  return mediaReply(context, response);
}
