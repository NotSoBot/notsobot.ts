import { Command, Interaction } from 'detritus-client';

import { mediaICreateSoup } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.soup';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'soup notsobot',
  inputs: [],
  script: [
    'soup img notsobot',
    'render img image/webp',
  ].join('\n'),
};
export const MAX_TEXT_LENGTH = 14;

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaICreateSoup(context, {
    safe: DefaultParameters.safe(context),
    text: args.text,
  });
  return mediaReply(context, response);
}
