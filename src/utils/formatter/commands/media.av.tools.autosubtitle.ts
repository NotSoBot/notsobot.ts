import { Command, Interaction } from 'detritus-client';

import { mediaAVToolsAutoSubtitle } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaMemeFonts } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.tools.autosubtitle';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'autosubtitle -highlight',
  inputs: ['voice'],
  script: [
    'load FILE_1 audio',
    'autosubtitle audio HIGHLIGHT=true',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  // a bundled font or one of their (or the server's) saved fonts' names
  font?: MediaMemeFonts | string,
  // a font file of their own (a link or an attachment's), instead of `font`
  fontUrl?: string,
  highlight?: boolean,
  url: string,
  yellow?: boolean,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVToolsAutoSubtitle(context, {
    font: args.font,
    fontUrl: args.fontUrl,
    highlight: args.highlight,
    safe: DefaultParameters.safe(context),
    url: args.url,
    yellow: args.yellow,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
