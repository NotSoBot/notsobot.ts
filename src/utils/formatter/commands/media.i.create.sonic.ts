import { Command, Interaction } from 'detritus-client';

import { mediaICreateSonic } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.sonic';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'sonic drink water',
  inputs: [],
  script: [
    'sonic img drink water',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaICreateSonic(context, {
    safe: DefaultParameters.safe(context),
    text: args.text,
  });
  return mediaReply(context, response);
}
