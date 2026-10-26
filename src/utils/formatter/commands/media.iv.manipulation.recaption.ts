import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationRecaption } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaMemeFonts } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';

import { splitText } from './media.iv.manipulation.caption';


export const COMMAND_ID = 'media.iv.manipulation.recaption';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'recaption what an idiot',
  inputs: ['captioned'],
  script: [
    'load FILE_1 img',
    'uncaption img',
    'caption img what an idiot',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  font?: MediaMemeFonts,
  text: string,
  tolerance?: number,
  url: string,
}

// uncaption then caption in one job on the api (it used to be two jobs here, with the file sent back and forth)
export async function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile, safe?: boolean},
) {
  const { bottom, top } = splitText(args.text);
  return mediaIVManipulationRecaption(context, {
    bottom,
    file: args.file,
    font: args.font,
    safe: args.safe || DefaultParameters.safe(context),
    tolerance: args.tolerance,
    top,
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile, safe?: boolean},
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
