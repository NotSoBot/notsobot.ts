import { Command, Interaction } from 'detritus-client';

import { utilitiesMLEdit } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'tools.ml.edit';

export interface CommandArgs {
  count?: number,
  guidance?: number,
  no?: string,
  query: string,
  safe?: boolean,
  seed?: number,
  steps?: number,
  strength?: number,
  url: string, 
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesMLEdit(context, args);
  return imageReply(context, response);
}
