import { Command, Interaction } from 'detritus-client';

import { mediaAIVToolsConvert } from '../../../api';
import { Mimetypes, MimetypesToExtension, MIMETYPES_IMAGE_EMBEDDABLE } from '../../../constants';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.tools.convert';
export const IS_PIPEABLE = true;

export const DEFAULT_MIMETYPE = Mimetypes.IMAGE_PNG;

export const SLASH_CHOICES = MIMETYPES_IMAGE_EMBEDDABLE.map((mimetype) => {
  let name = `.${MimetypesToExtension[mimetype]} (${mimetype})`;
  if (mimetype === DEFAULT_MIMETYPE) {
    name = `${name} (Default)`;
  }
  return {name, value: mimetype};
}).sort((x) => (x.value === DEFAULT_MIMETYPE) ? -1 : 0);


export interface CommandArgs {
  to: string,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVToolsConvert(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
