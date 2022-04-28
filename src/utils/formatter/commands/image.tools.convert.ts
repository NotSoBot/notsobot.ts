import { Command, Interaction } from 'detritus-client';

import { imageToolsConvert } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.tools.convert';

export interface CommandArgs {
  size?: string,
  to: string,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageToolsConvert(context, args);
  return imageReply(context, response);
}
