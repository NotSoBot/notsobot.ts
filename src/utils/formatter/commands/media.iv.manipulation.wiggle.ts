import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationWiggle } from '../../../api';
import { MediaWiggleDirections } from '../../../constants';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.wiggle';
export const IS_PIPEABLE = true;

export const DEFAULT_DIRECTION = MediaWiggleDirections.RIGHT;

export interface CommandArgs {
  amount?: number,
  direction?: string,
  url: string,
  wavelengths?: number,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationWiggle(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
