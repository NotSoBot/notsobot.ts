import { Command, Interaction } from 'detritus-client';

import { imageManipulationMeme } from '../../../api';
import { ImageMemeFonts } from '../../../constants';
import { imageReply } from '../../../utils';


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

  const { font, text, url } = args;

  let top: string = '';
  let bottom: string | undefined;
  if (text.includes('|')) {
    [ top, bottom ] = text.split('|');
  } else if (text.includes(' ')) {
    const split = text.split(' ');
    const half = Math.floor(split.length / 2);
    top = split.slice(0, half).join(' ');
    bottom = split.slice(half).join(' ');
  } else {
    top = text;
  }

  const response = await imageManipulationMeme(context, {bottom, font, top, url});
  return imageReply(context, response);
}
