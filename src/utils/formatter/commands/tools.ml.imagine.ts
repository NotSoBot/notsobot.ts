import { Command, Interaction } from 'detritus-client';

import { utilitiesMLImagine } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'tools.ml.imagine';

export interface CommandArgs {
  count?: number,
  guidance?: number,
  no?: string,
  query: string,
  safe?: boolean,
  seed?: number,
  steps?: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesMLImagine(context, args);
  return imageReply(context, response);
}
