import { Command, Interaction } from 'detritus-client';

import { imageManipulationMirrorTop } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.mirror.top';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationMirrorTop(context, {url: args.url});
  return imageReply(context, response, 'mirror-top');
}
