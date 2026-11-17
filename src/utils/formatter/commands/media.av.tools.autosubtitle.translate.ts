import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { GoogleLocales, MediaMemeFonts } from '../../../constants';
import { Parameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';

import * as MediaAVToolsAutoSubtitle from './media.av.tools.autosubtitle';


// `autosubtitle` with the subtitles translated, to the user's language unless `to` says otherwise (like `ocrtranslate`
// and `transcribetranslate` next to theirs). The api leaves them as heard when that's the language already spoken
export const COMMAND_ID = 'media.av.tools.autosubtitle.translate';
export const IS_PIPEABLE = true;

// written out (not `extends`), scripts/pipe-mediascript-lines.js reads the fields from this source
export interface CommandArgs {
  font?: MediaMemeFonts | string,
  fontUrl?: string,
  // only kept when it's already in `to`'s language, a translation has no word timings
  highlight?: boolean,
  // the prefixed and slash commands default it to the user's language (`DefaultParameters.locale`)
  to: GoogleLocales,
  url: string,
  yellow?: boolean,
}

function toAutoSubtitle(args: CommandArgs): MediaAVToolsAutoSubtitle.CommandArgs {
  const { to, ...rest } = args;
  return {...rest, translate: to};
}

export function fromCommandArgs(args: Omit<CommandArgs, 'font'> & {font?: Parameters.MediaFontArgs | string}): CommandArgs {
  const { to, ...rest } = args;
  return {...MediaAVToolsAutoSubtitle.fromCommandArgs(rest), to};
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  const { file, ...rest } = args;
  return MediaAVToolsAutoSubtitle.createJob(context, {...toAutoSubtitle(rest), file});
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return MediaAVToolsAutoSubtitle.createMediascript(toAutoSubtitle(args), chain);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
