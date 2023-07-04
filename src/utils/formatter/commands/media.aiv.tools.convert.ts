import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAIVToolsConvert } from '../../../api';
import { Mimetypes, MimetypesToExtension, MIMETYPES_AUDIO_EMBEDDABLE, MIMETYPES_IMAGE_EMBEDDABLE, MIMETYPES_VIDEO_EMBEDDABLE, MIMETYPES_SAFE_EMBED } from '../../../constants';
import { imageReply, mediaReply, parseFilenameFromResponse } from '../..';


export const COMMAND_ID = 'media.aiv.tools.convert';
export const IS_PIPEABLE = true;

export const SLASH_PARAMETERS: {
  AUDIO: {COMMAND_ID: string, DEFAULT_MIMETYPE: Mimetypes, SLASH_CHOICES: Array<{name: string, value: string}>},
  IMAGE: {COMMAND_ID: string, DEFAULT_MIMETYPE: Mimetypes, SLASH_CHOICES: Array<{name: string, value: string}>},
  VIDEO: {COMMAND_ID: string, DEFAULT_MIMETYPE: Mimetypes, SLASH_CHOICES: Array<{name: string, value: string}>},
} = {
  AUDIO: {COMMAND_ID: `${COMMAND_ID}.audio`, DEFAULT_MIMETYPE: Mimetypes.AUDIO_MP3, SLASH_CHOICES: []},
  IMAGE: {COMMAND_ID: `${COMMAND_ID}.image`, DEFAULT_MIMETYPE: Mimetypes.IMAGE_PNG, SLASH_CHOICES: []},
  VIDEO: {COMMAND_ID: `${COMMAND_ID}.video`, DEFAULT_MIMETYPE: Mimetypes.VIDEO_MP4, SLASH_CHOICES: []},
};

SLASH_PARAMETERS.AUDIO.SLASH_CHOICES = MIMETYPES_AUDIO_EMBEDDABLE.map((mimetype) => {
  let name = `.${MimetypesToExtension[mimetype]} (${mimetype})`;
  if (mimetype === SLASH_PARAMETERS.AUDIO.DEFAULT_MIMETYPE) {
    name = `${name} (Default)`;
  }
  return {name, value: mimetype};
}).sort((x) => (x.value === SLASH_PARAMETERS.AUDIO.DEFAULT_MIMETYPE) ? -1 : 0);

SLASH_PARAMETERS.IMAGE.SLASH_CHOICES = MIMETYPES_IMAGE_EMBEDDABLE.map((mimetype) => {
  let name = `.${MimetypesToExtension[mimetype]} (${mimetype})`;
  if (mimetype === SLASH_PARAMETERS.IMAGE.DEFAULT_MIMETYPE) {
    name = `${name} (Default)`;
  }
  return {name, value: mimetype};
}).sort((x) => (x.value === SLASH_PARAMETERS.IMAGE.DEFAULT_MIMETYPE) ? -1 : 0);

SLASH_PARAMETERS.VIDEO.SLASH_CHOICES = [...MIMETYPES_AUDIO_EMBEDDABLE, ...MIMETYPES_VIDEO_EMBEDDABLE].map((mimetype) => {
  let name = `.${MimetypesToExtension[mimetype]} (${mimetype})`;
  if (mimetype === SLASH_PARAMETERS.VIDEO.DEFAULT_MIMETYPE) {
    name = `${name} (Default)`;
  }
  return {name, value: mimetype};
}).sort((x) => (x.value === SLASH_PARAMETERS.VIDEO.DEFAULT_MIMETYPE) ? -1 : 0);


export interface CommandArgs {
  file?: RequestFile,
  noaudio?: boolean,
  to?: string,
  url: string,
}

export async function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return await mediaAIVToolsConvert(context, {
    file: args.file,
    to: args.to,
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  const mimetype = (response.headers.get('content-type') || '').toLowerCase();

  if (MIMETYPES_SAFE_EMBED.includes(mimetype as Mimetypes)) {
    return imageReply(context, response);
  }
  return mediaReply(context, response);
}
