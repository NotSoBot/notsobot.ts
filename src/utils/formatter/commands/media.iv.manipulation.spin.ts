import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationSpin } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.spin';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  counterclockwise?: boolean,
  nocircle?: boolean,
  nocrop?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationSpin(context, {
    file: args.file,
    clockwise: !args.counterclockwise,
    circle: !args.nocircle,
    crop: !args.nocrop,
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
