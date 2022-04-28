import { Command, Interaction } from 'detritus-client';

import { imageManipulationSharpen } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.sharpen';

export interface CommandArgs {
  scale?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationSharpen(context, args);
  return imageReply(context, response);
}
