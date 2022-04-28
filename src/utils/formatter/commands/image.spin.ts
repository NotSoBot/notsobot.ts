import { Command, Interaction } from 'detritus-client';

import { imageManipulationSpin } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.spin';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationSpin(context, args);
  return imageReply(context, response);
}
