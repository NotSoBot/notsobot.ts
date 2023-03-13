import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAIVToolsConvert } from '../../../api';
import { Mimetypes, MIMETYPES_SAFE_EMBED } from '../../../constants';
import { imageReply, mediaReply, parseFilenameFromResponse } from '../../../utils';


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
