import { Command, Interaction } from 'detritus-client';

import { imageToolsTrim } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.tools.trim';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageToolsTrim(context, args);
  return imageReply(context, response);
}
