import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAVManipulationAudioDelay } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.delay';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  delay?: number,
  nosnip?: boolean,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaAVManipulationAudioDelay(context, {
    delay: args.delay,
    file: args.file,
    snip: !args.nosnip,
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
