import { Command, Interaction } from 'detritus-client';

import { mediaAVToolsExtractAudio } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.av.tools.extract.audio';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'extract audio',
  inputs: ['video'],
  script: [
    'load FILE_1 clip',
    'convert clip audio/mpeg',
    'render clip',
  ].join('\n'),
};

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaAVToolsExtractAudio(context, {
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
  return mediaReply(context, response);
}
