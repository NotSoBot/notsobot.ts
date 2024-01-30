import { Command, Interaction } from 'detritus-client';
import { MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';

import { utilitiesFetchMedia } from '../../../api';
import { Mimetypes, MIMETYPES_SAFE_EMBED } from '../../../constants';
import { imageReply, mediaReply } from '../../../utils';


export const COMMAND_ID = 'tools.download';

export const FILE_SIZE_BUFFER = 10 * 1024; // 10 kb


export interface CommandArgs {
  safe?: boolean,
  spoiler?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE) - FILE_SIZE_BUFFER;
  const response = await utilitiesFetchMedia(context, {maxFileSize, safe: args.safe, url: args.url});
  const mimetype = response.file.metadata.mimetype;

  if (MIMETYPES_SAFE_EMBED.includes(mimetype as Mimetypes)) {
    return imageReply(context, response, {spoiler: args.spoiler});
  }
  return mediaReply(context, response, {spoiler: args.spoiler});
}
