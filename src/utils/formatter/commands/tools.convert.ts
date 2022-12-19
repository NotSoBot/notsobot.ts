import { Command, Interaction } from 'detritus-client';
import { MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';
import { RequestFile, Response } from 'detritus-rest';

import { audioToolsConvert, imageToolsConvert, utilitiesFetchMedia, videoToolsConvert } from '../../../api';
import { Mimetypes, MIMETYPES_SAFE_EMBED } from '../../../constants';
import { imageReply, mediaReply, parseFilenameFromResponse } from '../../../utils';

import { DEFAULT_MIMETYPE as DEFAULT_AUDIO_MIMETYPE } from './audio.convert';
import { DEFAULT_MIMETYPE as DEFAULT_IMAGE_MIMETYPE } from './image.tools.convert';
import { DEFAULT_MIMETYPE as DEFAULT_VIDEO_MIMETYPE } from './video.convert';


export const COMMAND_ID = 'tools.convert';
export const IS_PIPEABLE = true;

export const FILE_SIZE_BUFFER = 10 * 1024; // 10 kb


export interface CommandArgs {
  file?: RequestFile,
  size?: string,
  to?: string,
  url: string,
}

export async function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  if (args.file) {
    return await imageToolsConvert(context, {
      file: args.file,
      size: args.size,
      to: args.to || DEFAULT_IMAGE_MIMETYPE,
    });
  }

  const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE) - FILE_SIZE_BUFFER;
  const mediaResponse = await utilitiesFetchMedia(context, {maxFileSize, url: args.url});
  const mimetype = (mediaResponse.headers.get('content-type') || '').toLowerCase();
  const filename = parseFilenameFromResponse(mediaResponse);

  const file = {mimetype, filename, value: await mediaResponse.buffer()};

  let response: Response;
  if (mimetype.startsWith('audio/')) {
    response = await audioToolsConvert(context, {file, to: args.to || DEFAULT_AUDIO_MIMETYPE});
  } else if (mimetype.startsWith('image/')) {
    response = await imageToolsConvert(context, {file, to: args.to || DEFAULT_IMAGE_MIMETYPE});
  } else if (mimetype.startsWith('video/')) {
    response = await videoToolsConvert(context, {file, to: args.to || DEFAULT_VIDEO_MIMETYPE});
  } else {
    throw new Error('Don\'t know what to convert this to');
  }
  return response;
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
