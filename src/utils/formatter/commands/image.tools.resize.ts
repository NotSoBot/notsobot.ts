import { Command, Interaction } from 'detritus-client';

import { imageToolsResize } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.tools.resize';

export interface CommandArgs {
  convert?: string,
  scale: number,
  size?: string,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageToolsResize(context, args);
  return imageReply(context, response);
}
