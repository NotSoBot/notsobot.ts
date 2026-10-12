import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationMeme } from '../../../api';
import { MediaMemeFonts } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.meme';
export const IS_PIPEABLE = true;

export const DEFAULT_FONT = MediaMemeFonts.IMPACT;

export interface CommandArgs {
  font?: MediaMemeFonts,
  text: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  const { bottom, top } = splitText(args.text);
  return mediaIVManipulationMeme(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    bottom,
    top,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}


export function splitText(text: string): {bottom?: string, top: string} {
  let top: string = '';
  let bottom: string | undefined;
  if (text.includes('|')) {
    const parts = text.split('|');
    top = parts.shift()!;
    bottom = parts.join('|');
  } else if (text.includes(' ')) {
    const split = text.split(' ');
    const half = Math.floor(split.length / 2);
    top = split.slice(0, half).join(' ');
    bottom = split.slice(half).join(' ');
  } else {
    top = text;
  }
  return {bottom, top};
}
