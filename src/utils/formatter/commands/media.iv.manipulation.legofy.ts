import { Command, Interaction } from 'detritus-client';

import { imageManipulationLegofy } from '../../../api';
import { ImageLegofyPalettes } from '../../../constants';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.legofy';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  dither: boolean,
  palette?: ImageLegofyPalettes,
  size?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationLegofy(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
