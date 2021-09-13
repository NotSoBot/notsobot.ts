import { Command, Interaction } from 'detritus-client';

import { imageToolsGifReverse } from '../../../api';
import { imageReply } from '../../../utils';


export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageToolsGifReverse(context, args);
  return imageReply(context, response);
}
