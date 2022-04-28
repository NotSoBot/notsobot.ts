import { Command, Interaction } from 'detritus-client';

import { audioToolsConvert } from '../../../api';
import { Mimetypes, MimetypesToExtension, MIMETYPES_AUDIO_EMBEDDABLE } from '../../../constants';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'audio.convert';

export const DEFAULT_MIMETYPE = Mimetypes.AUDIO_MP3;

export const SLASH_CHOICES = MIMETYPES_AUDIO_EMBEDDABLE.map((mimetype) => {
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
  const response = await audioToolsConvert(context, {
    to: args.to,
    url: args.url,
  });
  return mediaReply(context, response);
}
