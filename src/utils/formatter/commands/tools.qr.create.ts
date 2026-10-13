import { Command, Interaction } from 'detritus-client';

import { utilitiesQrCreate } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'tools.qr.create';

export interface CommandArgs {
  margin?: number,
  query: string,
  size?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesQrCreate(context, args);
  return mediaReply(context, response);
}
