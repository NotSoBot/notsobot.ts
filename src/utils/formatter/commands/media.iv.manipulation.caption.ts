import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationCaption } from '../../../api';
import { MediaMemeFonts } from '../../../constants';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.caption';
export const IS_PIPEABLE = true;

export const DEFAULT_FONT = MediaMemeFonts.FUTURA_CONDENSED_EXTRA_BOLD;

export interface CommandArgs {
  font?: MediaMemeFonts,
  text: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  const { file, font, text, url } = args;
  const { bottom, top } = splitText(text);
  return mediaIVManipulationCaption(context, {bottom, file, font, top, url});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}


export function splitText(text: string): {bottom?: string, top: string} {
  let top: string = '';
  let bottom: string | undefined;
  if (text.includes('|')) {
    const parts = text.split('|');
    top = parts.shift()!;
    bottom = parts.join('|');
  } else {
    top = text;
  }
  return {bottom, top};
}
