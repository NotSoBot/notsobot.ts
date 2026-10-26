import { Command, Interaction } from 'detritus-client';

import { mediaICreateSnowWriting } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.snow.writing';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'snow line 1 | line 2',
  inputs: [],
  script: [
    'snowwriting img line 1 | line 2',
    'render img image/webp',
  ].join('\n'),
};
export const MAX_TEXT_LENGTH = 15;
export const MAX_TEXT_2_LENGTH = 15;

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
  const response = await mediaICreateSnowWriting(context, {
    safe: DefaultParameters.safe(context),
    text,
    text2,
  });
  return mediaReply(context, response);
}
