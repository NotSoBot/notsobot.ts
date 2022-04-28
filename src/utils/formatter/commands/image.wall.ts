import { Command, Interaction } from 'detritus-client';

import { imageManipulationWall } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.wall';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationWall(context, args);
  return imageReply(context, response);
}
