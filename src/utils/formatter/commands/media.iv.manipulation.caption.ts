import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationCaption } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaMemeFonts } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.caption';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'caption when the bot works',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'caption img when the bot works',
    'render img image/webp',
  ].join('\n'),
};

export const DEFAULT_FONT = MediaMemeFonts.FUTURA_CONDENSED_EXTRA_BOLD;

export interface CommandArgs {
  // a bundled font or one of their (or the server's) saved fonts' names
  font?: MediaMemeFonts | string,
  // a font file of their own (a link or an attachment's), instead of `font`
  fontUrl?: string,
  text: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  const { bottom, top } = splitText(args.text);
  return mediaIVManipulationCaption(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    bottom,
    top,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // piped, the prefixed command's `-font` is still `{font, fontUrl}` (its `run` splits it)
  const { font, fontUrl }: {font?: string, fontUrl?: string} = (args.font && typeof(args.font) === 'object') ? args.font : args;
  // their own font file or a saved font's name, mediascript only knows the bundled fonts. no font is their Default Font
  if (fontUrl || (font && !(Object.values(MediaMemeFonts) as Array<string>).includes(font))) {
    return null;
  }
  // mediascript splits `top | bottom` on the first `|` like `splitText`
  return Mediascript.line('caption', chain.key, {font, text: args.text});
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
