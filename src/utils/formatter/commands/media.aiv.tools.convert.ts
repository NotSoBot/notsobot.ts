import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAIVToolsConvert } from '../../../api';
import {
  Mimetypes,
  MimetypesToExtension,
  MIMETYPES_AUDIO_EMBEDDABLE,
  MIMETYPES_IMAGE_EMBEDDABLE,
  MIMETYPES_VIDEO_EMBEDDABLE,
  MIMETYPES_SAFE_EMBED,
} from '../../../constants';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.tools.convert';
export const IS_PIPEABLE = true;

export const SLASH_PARAMETERS: {
  AV: {COMMAND_ID: string, SLASH_CHOICES: Array<{name: string, value: string}>},
  IV: {COMMAND_ID: string, SLASH_CHOICES: Array<{name: string, value: string}>},
  AUDIO: {COMMAND_ID: string, DEFAULT_MIMETYPE: Mimetypes, SLASH_CHOICES: Array<{name: string, value: string}>},
  IMAGE: {COMMAND_ID: string, DEFAULT_MIMETYPE: Mimetypes, SLASH_CHOICES: Array<{name: string, value: string}>},
  VIDEO: {COMMAND_ID: string, DEFAULT_MIMETYPE: Mimetypes, SLASH_CHOICES: Array<{name: string, value: string}>},
} = {
  AV: {COMMAND_ID: `${COMMAND_ID}.av`, SLASH_CHOICES: []},
  IV: {COMMAND_ID: `${COMMAND_ID}.iv`, SLASH_CHOICES: []},
  AUDIO: {COMMAND_ID: `${COMMAND_ID}.audio`, DEFAULT_MIMETYPE: Mimetypes.AUDIO_MP3, SLASH_CHOICES: []},
  IMAGE: {COMMAND_ID: `${COMMAND_ID}.image`, DEFAULT_MIMETYPE: Mimetypes.IMAGE_PNG, SLASH_CHOICES: []},
  VIDEO: {COMMAND_ID: `${COMMAND_ID}.video`, DEFAULT_MIMETYPE: Mimetypes.VIDEO_MP4, SLASH_CHOICES: []},
};

SLASH_PARAMETERS.AV.SLASH_CHOICES = [...MIMETYPES_AUDIO_EMBEDDABLE, ...MIMETYPES_VIDEO_EMBEDDABLE].map((mimetype) => {
  let name = `.${MimetypesToExtension[mimetype]} (${mimetype})`;
  return {name, value: mimetype};
});

SLASH_PARAMETERS.IV.SLASH_CHOICES = [...MIMETYPES_IMAGE_EMBEDDABLE, ...MIMETYPES_VIDEO_EMBEDDABLE].map((mimetype) => {
  let name = `.${MimetypesToExtension[mimetype]} (${mimetype})`;
  return {name, value: mimetype};
});

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

export async function createJob(
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
  const response = await createJob(context, args);
  return jobReply(context, response);
}
