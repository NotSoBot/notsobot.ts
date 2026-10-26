import { Command, Interaction } from 'detritus-client';

import { mediaICreateNeon } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.neon';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'neon line 1 | line 2',
  inputs: [],
  script: [
    'neon img line 1 | line 2',
    'render img image/webp',
  ].join('\n'),
};
export const MAX_TEXT_LENGTH = 20;
export const MAX_TEXT_2_LENGTH = 20;

export interface CommandArgs {
  text: string,
  text2?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  let { text, text2 } = args;
  if (text2 === undefined && text.includes('|')) {
    // prefixed commands take both lines as `line 1 | line 2`
    [text, text2] = text.split('|', 2).map((part) => part.trim());
  }
  const response = await mediaICreateNeon(context, {
    safe: DefaultParameters.safe(context),
    text,
    text2,
  });
  return mediaReply(context, response);
}
