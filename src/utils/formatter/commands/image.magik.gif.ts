import { Command, Interaction } from 'detritus-client';

import { imageManipulationMagikGif } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.magik.gif';

export interface CommandArgs {
  scale?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationMagikGif(context, args);
  return imageReply(context, response);
}
