import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationOverlayNews } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.overlay.news';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'text news Local man finds bug in production',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'news img Local man finds bug in production',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  label?: string,
  text: string,
  ticker?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationOverlayNews(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // mediascript splits `headline | ticker`, the route would show a `|` in the headline as is
  if (args.text.includes('|')) {
    return null;
  }
  const text = (args.ticker) ? `${args.text} | ${args.ticker}` : args.text;
  return Mediascript.line('news', chain.key, {label: args.label, text});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
