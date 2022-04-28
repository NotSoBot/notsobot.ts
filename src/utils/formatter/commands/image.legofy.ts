import { Command, Interaction } from 'detritus-client';

import { imageManipulationLegofy } from '../../../api';
import { ImageLegofyPalettes } from '../../../constants';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.legofy';

export interface CommandArgs {
  dither: boolean,
  palette?: ImageLegofyPalettes,
  size?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationLegofy(context, args);
  return imageReply(context, response);
}
