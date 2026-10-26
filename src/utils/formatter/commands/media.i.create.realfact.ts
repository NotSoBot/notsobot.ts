import { Command, Interaction } from 'detritus-client';

import { mediaICreateRealfact } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.realfact';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'realfact cats cannot taste sweetness',
  inputs: [],
  script: [
    'realfact img cats cannot taste sweetness',
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
  const response = await mediaICreateRealfact(context, {
    safe: DefaultParameters.safe(context),
    text: args.text,
  });
  return mediaReply(context, response);
}
