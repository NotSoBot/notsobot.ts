import { Command, Interaction } from 'detritus-client';

import { imageManipulationJPEG } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.needsmorejpeg';

export interface CommandArgs {
  quality?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationJPEG(context, args);
  return imageReply(context, response);
}
