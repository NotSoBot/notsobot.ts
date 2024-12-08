import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationCaption } from '../../../api';
import { ImageMemeFonts } from '../../../constants';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.caption';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  font?: ImageMemeFonts,
  text: string,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationCaption(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
