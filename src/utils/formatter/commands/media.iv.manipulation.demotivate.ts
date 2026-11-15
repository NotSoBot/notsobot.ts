import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationDemotivate } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.demotivate';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'text demotivate NotSoBot | it does things',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'demotivate img NotSoBot | it does things',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  text?: string,
  title: string,
  url: string,
}

// the prefixed command's `title | text` (the text is optional), its `run` uses this too
export function fromCommandArgs(args: CommandArgs): CommandArgs {
  if (args.title !== undefined) {
    return args;
  }
  const [ before, ...after ] = (args.text || '').split('|');
  // without a `|` there's no text, it used to be the title again
  return {...args, text: (after.length) ? after.join('|').trim() : undefined, title: before.trim()};
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationDemotivate(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // mediascript gets `title | text` and splits it on the first `|`, trimming both
  const { text, title } = args;
  // a title with a `|` in it or either with spaces around it would come out different
  if (title.includes('|') || title !== title.trim() || (text && text !== text.trim())) {
    return null;
  }
  return Mediascript.line('demotivate', chain.key, {text: (text) ? `${title} | ${text}` : title});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
