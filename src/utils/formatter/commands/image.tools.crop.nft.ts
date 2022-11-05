import { Command, Interaction } from 'detritus-client';

import { imageToolsCropTwitterHex } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.tools.crop.nft';

export interface CommandArgs {
  background?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageToolsCropTwitterHex(context, args);
  return imageReply(context, response);
}
