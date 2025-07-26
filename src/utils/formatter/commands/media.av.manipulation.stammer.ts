import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationStammer } from '../../../api';
import { MediaStammerColorModes, MediaStammerMatcherModes } from '../../../constants';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.tools.stammer';
export const IS_PIPEABLE = true;

export const DEFAULT_COLOR_MODE = MediaStammerColorModes.FULL;
export const DEFAULT_MATCHER_MODE = MediaStammerMatcherModes.BASIC;

export interface CommandArgs {
  colorMode?: string,
  matcherMode?: string,
  urls: Array<string>,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationStammer(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
