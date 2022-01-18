import { Command, Interaction } from 'detritus-client';

import { imageOverlayHalfLifePistol } from '../../../api';
import { imageReply } from '../../../utils';


export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageOverlayHalfLifePistol(context, args);
  return imageReply(context, response);
}
