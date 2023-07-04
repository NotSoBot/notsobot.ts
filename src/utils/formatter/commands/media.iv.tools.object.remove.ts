import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsObjectRemove } from '../../../api';
import { ImageObjectRemovalLabels} from '../../../constants';
import { imageReply, toTitleCase } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.object.remove';
export const IS_PIPEABLE = false;

export const DEFAULT_OBJECT = ImageObjectRemovalLabels.PERSON;

export interface CommandArgs {
  object?: string,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsObjectRemove(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
