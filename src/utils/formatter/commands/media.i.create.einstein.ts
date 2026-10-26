import { Command, Interaction } from 'detritus-client';

import { mediaICreateEinstein } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.einstein';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'einstein e=mc2',
  inputs: [],
  script: [
    'einstein img e=mc2',
    'render img image/webp',
  ].join('\n'),
};
export const MAX_TEXT_LENGTH = 15;

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaICreateEinstein(context, {
    safe: DefaultParameters.safe(context),
    text: args.text,
  });
  return mediaReply(context, response);
}
