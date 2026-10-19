import { Command, Interaction } from 'detritus-client';

import { mediaICreateEinstein } from '../../../api';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.einstein';
export const MAX_TEXT_LENGTH = 15;

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaICreateEinstein(context, {
    safe: DefaultParameters.safe(context),
    text: args.text,
  });
  return mediaReply(context, response);
}
