import { Command, Interaction } from 'detritus-client';

import { imageManipulationImplode } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.implode';

export interface CommandArgs {
  scale?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationImplode(context, args);
  return imageReply(context, response);
}