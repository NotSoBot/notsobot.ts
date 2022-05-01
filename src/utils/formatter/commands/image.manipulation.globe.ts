import { Command, Interaction } from 'detritus-client';

import { imageManipulationGlobe } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.manipulation.globe';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationGlobe(context, args);
  return imageReply(context, response);
}
