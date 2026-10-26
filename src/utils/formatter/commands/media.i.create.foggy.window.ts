import { Command, Interaction } from 'detritus-client';

import { mediaICreateFoggyWindow } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.foggy.window';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'foggy notsobot',
  inputs: [],
  script: [
    'foggywindow img notsobot',
    'render img image/webp',
  ].join('\n'),
};
export const MAX_TEXT_LENGTH = 20;

export interface CommandArgs {
  text: string,
  background?: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaICreateFoggyWindow(context, {
    safe: DefaultParameters.safe(context),
    text: args.text,
    background: args.background,
  });
  return mediaReply(context, response);
}
