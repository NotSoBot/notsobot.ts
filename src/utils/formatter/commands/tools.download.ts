import { Command, Interaction } from 'detritus-client';
import { MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';

import { utilitiesFetchMedia } from '../../../api';
import { Mimetypes, MIMETYPES_SAFE_EMBED } from '../../../constants';
import { imageReply, mediaReply } from '../../../utils';


export const COMMAND_ID = 'tools.download';

export const FILE_SIZE_BUFFER = 10 * 1024; // 10 kb


export interface CommandArgs {
  quality?: string,
  safe?: boolean,
  spoiler?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const maxFileSize = ((context.guild) ? context.guild.maxAttachmentSize : MAX_ATTACHMENT_SIZE) - FILE_SIZE_BUFFER;
  const response = await utilitiesFetchMedia(context, {
    downloadQuality: args.quality,
    maxFileSize,
    safe: args.safe,
    url: args.url,
  });
  return mediaReply(context, response, {spoiler: args.spoiler});
}
