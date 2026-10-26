import { Command, Interaction } from 'detritus-client';

import { utilitiesMLImagine, utilitiesMLInterrogate } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'tools.ml.reimagine';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'reimagine',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'reimagine img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  add?: string,
  model?: string,
  query: string,
  safe?: boolean,
  seed?: number,
  steps?: number,
  url: string, 
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  let { prompt } = await utilitiesMLInterrogate(context, {url: args.url});
  if (args.add) {
    prompt = `${prompt}, ${args.add}`;
  }
  const response = await utilitiesMLImagine(context, {
    ...args,
    query: prompt,
    safe: true,
  });
  return jobReply(context, response);
}
