import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAIVManipulationAudioPutConcat } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import { UserError } from '../../errors';
import { getCachedTranslator } from '../../i18n';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.a.tools.put.concat';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio put concat',
  inputs: ['voice', 'music'],
  script: [
    'load FILE_1 voice',
    'load FILE_2 music',
    'audioputconcat voice music',
    'render voice',
  ].join('\n'),
};

export interface CommandArgs {
  longest?: boolean,
  noloop?: boolean,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  if (args.file) {
    // the endpoint takes uploads before links, so a piped file can't go after the audio it gets (mediascript's can)
    throw new UserError(getCachedTranslator(context).translate('media.pipe.cant_pipe', {command: COMMAND_ID}));
  }
  args.urls = args.urls.reverse();
  return mediaAIVManipulationAudioPutConcat(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  if (!args.urls || args.urls.length !== 2) {
    return null;
  }
  // the piped media gets the second one's audio (`createJob` reverses them for the endpoint)
  return Mediascript.line('audioputconcat', chain.key, chain.load(args.urls[1]), {
    longest: args.longest,
    loop: (args.noloop) ? false : undefined,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
