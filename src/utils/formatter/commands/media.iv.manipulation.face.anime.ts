import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceAnime } from '../../../api';
import { MediaFaceAnimeEyes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.i.manipulation.face.anime';
export const IS_PIPEABLE = true;

export const DEFAULT_EYES = MediaFaceAnimeEyes.NORMAL;

export interface CommandArgs {
  eyes?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationFaceAnime(context, {
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
