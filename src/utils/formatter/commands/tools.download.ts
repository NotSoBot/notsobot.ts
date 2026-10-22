import { Command, Interaction } from 'detritus-client';

import { utilitiesFetchMedia } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'tools.download';


export interface CommandArgs {
  locale?: string,
  mediaFormat?: string,
  mediaPosition?: number,
  quality?: string,
  spoiler?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await utilitiesFetchMedia(context, {
    downloadQuality: args.quality,
    locale: args.locale,
    mediaFormat: args.mediaFormat,
    mediaPosition: args.mediaPosition,
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
  return jobReply(context, job, {spoiler: args.spoiler});
}
