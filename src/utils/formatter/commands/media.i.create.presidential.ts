import { Command, Interaction } from 'detritus-client';

import { mediaICreatePresidential } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { createTimestampMomentFromContext, DefaultParameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.presidential';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'presidential this is not a drill',
  inputs: [],
  script: [
    'presidential img this is not a drill',
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
  // the lock screen shows the time in the user's (or server's) timezone
  const now = createTimestampMomentFromContext(Date.now(), {guildId: context.guildId, userId: context.userId});
  const response = await mediaICreatePresidential(context, {
    date: now.format('dddd, MMMM D'),
    safe: DefaultParameters.safe(context),
    text: args.text,
    time: now.format('h:mm'),
  });
  return mediaReply(context, response);
}
