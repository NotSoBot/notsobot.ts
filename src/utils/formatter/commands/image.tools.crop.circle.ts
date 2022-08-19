import { Command, Interaction } from 'detritus-client';

import { imageToolsCropCircle } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.tools.crop.circle';

export interface CommandArgs {
  background?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageToolsCropCircle(context, args);
  return imageReply(context, response);
}
