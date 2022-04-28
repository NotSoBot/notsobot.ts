import { Command, Interaction } from 'detritus-client';

import { imageToolsRotate } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.tools.rotate';

export interface CommandArgs {
  amount?: number,
  iterations?: number,
  seed?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageToolsRotate(context, args);
  return imageReply(context, response);
}
