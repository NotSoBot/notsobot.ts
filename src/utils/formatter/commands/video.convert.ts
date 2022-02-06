import { Command, Interaction } from 'detritus-client';

import { videoToolsConvert } from '../../../api';
import { Mimetypes, MimetypesToExtension, MIMETYPES_VIDEO_EMBEDDABLE } from '../../../constants';
import { mediaReply } from '../../../utils';


export const DEFAULT_MIMETYPE = Mimetypes.VIDEO_MP4;

export const SLASH_CHOICES = MIMETYPES_VIDEO_EMBEDDABLE.map((mimetype) => {
  let name = `.${MimetypesToExtension[mimetype]} (${mimetype})`;
  if (mimetype === DEFAULT_MIMETYPE) {
    name = `${name} (Default)`;
  }
  return {name, value: mimetype};
}).sort((x) => (x.value === DEFAULT_MIMETYPE) ? -1 : 0);


export interface CommandArgs {
  to: Mimetypes,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await videoToolsConvert(context, args);
  return mediaReply(context, response);
}
