import { Command, Interaction } from 'detritus-client';

import { mediaICreateLucia } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.lucia';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'lucia hop on deadlock',
  inputs: [],
  script: [
    'lucia img hop on deadlock',
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
  const response = await mediaICreateLucia(context, {
    safe: DefaultParameters.safe(context),
    text: args.text,
  });
  return mediaReply(context, response);
}
