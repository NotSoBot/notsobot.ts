import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAVToolsAutoSubtitle } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { GoogleLocales, MediaMemeFonts } from '../../../constants';
import { DefaultParameters, Parameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.av.tools.autosubtitle';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'autosubtitle -highlight',
  inputs: ['voice'],
  script: [
    'load FILE_1 audio',
    'autosubtitle audio HIGHLIGHT=true',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  // a bundled font or one of their (or the server's) saved fonts' names
  font?: MediaMemeFonts | string,
  // a font file of their own (a link or an attachment's), instead of `font`
  fontUrl?: string,
  highlight?: boolean,
  // the subtitles translated to this language (no highlight then, a translation has no word timings)
  translate?: GoogleLocales | null,
  url: string,
  yellow?: boolean,
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
  return mediaAVToolsAutoSubtitle(context, {
    // a pipe's later steps get the media as `file`
    file: args.file,
    font: args.font,
    fontUrl: args.fontUrl,
    highlight: args.highlight,
    safe: DefaultParameters.safe(context),
    translate: args.translate || undefined,
    url: args.url,
    yellow: args.yellow,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // a font of their own or a saved one isn't something the script can load here, without one it's the Default Font
  // setting like the endpoint
  if (args.fontUrl || (args.font && !(Object.values(MediaMemeFonts) as Array<string>).includes(args.font))) {
    return null;
  }
  return Mediascript.line('autosubtitle', chain.key, {
    highlight: args.highlight, yellow: args.yellow, font: args.font, translate: args.translate || undefined,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
