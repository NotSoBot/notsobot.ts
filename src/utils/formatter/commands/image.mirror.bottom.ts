import { Command, Interaction } from 'detritus-client';

import { imageManipulationMirrorBottom } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.mirror.bottom';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationMirrorBottom(context, {url: args.url});
  return imageReply(context, response, 'mirror-bottom');
}
