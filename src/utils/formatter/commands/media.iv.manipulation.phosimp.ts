import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationPhoSimp } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.phosimp';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'phosimp 1 9 4',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'phosimp img 1 9 4',
    'render img image/webp',
  ].join('\n'),
};
// made PHOSIMP, the program this is based on
export const CREDITS = [{id: '533042282903896085', name: 'KANJICODER', url: 'https://store.steampowered.com/app/3721650/PHOSIMP/'}];

export interface CommandArgs {
  filters: Array<number>,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationPhoSimp(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
