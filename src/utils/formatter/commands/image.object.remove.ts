import { Command, Interaction } from 'detritus-client';

import { imageToolsObjectRemove } from '../../../api';
import { ImageObjectRemovalLabels} from '../../../constants';
import { imageReply, toTitleCase } from '../../../utils';


export const COMMAND_ID = 'image.object.remove';

export const DEFAULT_OBJECT = ImageObjectRemovalLabels.PERSON;

export interface CommandArgs {
  object?: string,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageToolsObjectRemove(context, args);
  return imageReply(context, response);
}
