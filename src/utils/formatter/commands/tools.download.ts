import { Command, Interaction } from 'detritus-client';
import { MAX_ATTACHMENT_SIZE } from 'detritus-client/lib/constants';

import { utilitiesFetchMedia } from '../../../api';
import { Mimetypes, MIMETYPES_SAFE_EMBED } from '../../../constants';
import { imageReply, mediaReply } from '../../../utils';


export const COMMAND_ID = 'tools.download';


export interface CommandArgs {
  locale?: string,
  mediaFormat?: string,
  mediaPosition?: number,
  quality?: string,
  safe?: boolean,
  spoiler?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesFetchMedia(context, {
    downloadQuality: args.quality,
    locale: args.locale,
    mediaFormat: args.mediaFormat,
    mediaPosition: args.mediaPosition,
    safe: args.safe,
    url: args.url,
  });
  return mediaReply(context, response, {spoiler: args.spoiler});
}
