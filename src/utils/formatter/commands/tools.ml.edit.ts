import { Command, Interaction } from 'detritus-client';

import { utilitiesMLEdit } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'tools.ml.edit';
export const IS_PIPEABLE = true;
// evan built the original ai imagine command on his mac mini, which this came from too
export const CREDITS = [{id: '188836645670223872', name: 'evan'}];

export interface CommandArgs {
  expand?: boolean,
  model?: string,
  query: string,
  seed?: number,
  steps?: number,
  strength?: number,
  url: string,
  urls?: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return utilitiesMLEdit(context, {
    urls: (args.url) ? [args.url] : undefined,
    ...args,
    safe: true,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
