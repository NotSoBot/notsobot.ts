import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { imageManipulationMeme } from '../../../api';
import { ImageMemeFonts } from '../../../constants';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.meme';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  font?: ImageMemeFonts,
  text: string,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  const { file, font, text, url } = args;

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

  return imageManipulationMeme(context, {bottom, file, font, top, url});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const response = await createResponse(context, args);
  return imageReply(context, response);
}
