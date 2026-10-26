import { Command, Interaction } from 'detritus-client';

import { mediaICreateHacker } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.hacker';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'hacker sudo hack the mainframe',
  inputs: [],
  script: [
    'hacker img sudo hack the mainframe',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  template?: number,
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaICreateHacker(context, {
    safe: DefaultParameters.safe(context),
    template: args.template,
    text: args.text,
  });
  return mediaReply(context, response);
}
