import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationPhoSimp } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.phosimp';
export const IS_PIPEABLE = true;
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
