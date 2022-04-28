import { Command, Interaction } from 'detritus-client';

import { imageManipulationRain } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.rain';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationRain(context, args);
  return imageReply(context, response);
}
