import { Command, Interaction } from 'detritus-client';

import { imageManipulationCaption } from '../../../api';
import { ImageMemeFonts } from '../../../constants';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.caption';
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
  return imageManipulationCaption(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const response = await createResponse(context, args);
  return imageReply(context, response);
}
