import { Command, Interaction } from 'detritus-client';

import { imageToolsCrop } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.tools.crop';

export interface CommandArgs {
  size?: string,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageToolsCrop(context, args);
  return imageReply(context, response);
}
