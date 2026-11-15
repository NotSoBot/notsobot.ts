import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationMeme } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaMemeFonts } from '../../../constants';
import { DefaultParameters, Parameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.meme';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'meme NotSo | Bot',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'meme img NotSo | Bot',
    'render img image/webp',
  ].join('\n'),
};

export const DEFAULT_FONT = MediaMemeFonts.IMPACT;

export interface CommandArgs {
  // a bundled font or one of their (or the server's) saved fonts' names
  font?: MediaMemeFonts | string,
  // a font file of their own (a link or an attachment's), instead of `font`
  fontUrl?: string,
  text: string,
  url: string,
}

// the prefixed command's parsed args for a pipe step: its `-font` is `{font, fontUrl}` until `run` splits it
export function fromCommandArgs(args: Omit<CommandArgs, 'font'> & {font?: Parameters.MediaFontArgs | string}): CommandArgs {
  if (args.font && typeof(args.font) === 'object') {
    return {...args, font: args.font.font, fontUrl: args.font.fontUrl || args.fontUrl};
  }
  return args as CommandArgs;
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

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // their own font file or a saved font's name is looked up on the request, mediascript only has the bundled ones
  if (args.fontUrl || (args.font && !Object.values<string>(MediaMemeFonts).includes(args.font))) {
    return null;
  }
  // the same `top | bottom` (or half the words each) split as `splitText`
  return Mediascript.line('meme', chain.key, {text: args.text, font: args.font});
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
