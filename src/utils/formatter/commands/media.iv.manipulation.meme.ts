import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationMeme } from '../../../api';
import { ImageMemeFonts } from '../../../constants';
import { jobReply } from '../..';


export const COMMAND_ID = 'media.iv.manipulation.meme';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  font?: ImageMemeFonts,
  text: string,
  url: string,
}

export function createJob(
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

  return mediaIVManipulationMeme(context, {bottom, file, font, top, url});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const response = await createJob(context, args);
  return jobReply(context, response);
}
