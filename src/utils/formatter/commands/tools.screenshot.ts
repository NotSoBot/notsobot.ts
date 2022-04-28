import { Command, Interaction } from 'detritus-client';

import { utilitiesScreenshot } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'tools.screenshot';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesScreenshot(context, args);
  return imageReply(context, response);
}
