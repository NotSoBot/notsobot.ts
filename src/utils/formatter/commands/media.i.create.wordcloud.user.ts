import { Command, Interaction, Structures } from 'detritus-client';

import * as MediaICreateWordcloudChannel from './media.i.create.wordcloud.channel';


export const COMMAND_ID = 'media.i.create.wordcloud.user';

export interface CommandArgs extends MediaICreateWordcloudChannel.CommandArgs {
  user: Structures.Member | Structures.User,
}

// same as the channel wordcloud (defaults to the current channel), but only with this user's messages
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const channel = args.channel || context.channel || undefined;
  const { user, ...options } = args;
  return MediaICreateWordcloudChannel.createMessage(context, {...options, channel}, user);
}
