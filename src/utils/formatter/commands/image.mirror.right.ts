import { Command, Interaction } from 'detritus-client';

import { imageManipulationMirrorRight } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.mirror.right';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationMirrorRight(context, {url: args.url});
  return imageReply(context, response, 'mirror-right');
}
