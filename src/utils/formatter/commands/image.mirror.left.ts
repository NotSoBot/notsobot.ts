import { Command, Interaction } from 'detritus-client';

import { imageManipulationMirrorLeft } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.mirror.left';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationMirrorLeft(context, {url: args.url});
  return imageReply(context, response, 'mirror-left');
}
