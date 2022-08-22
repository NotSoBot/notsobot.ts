import { Command, Interaction } from 'detritus-client';

import { imageManipulationCaption } from '../../../api';
import { ImageMemeFonts } from '../../../constants';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.caption';

export interface CommandArgs {
  font?: ImageMemeFonts,
  text: string,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const response = await imageManipulationCaption(context, args);
  return imageReply(context, response);
}
