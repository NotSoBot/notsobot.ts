import { Command, Interaction, Structures } from 'detritus-client';

import * as MediaICreateWordcloudChannel from './media.i.create.wordcloud.channel';


export const COMMAND_ID = 'media.i.create.wordcloud.user';

export interface CommandArgs {
  before?: string,
  channel?: Structures.Channel,
  max?: number,
  user: Structures.Member | Structures.User,
}

// same as the channel wordcloud (defaults to the current channel), but only with this user's messages
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const channel = args.channel || context.channel || undefined;
  return MediaICreateWordcloudChannel.createMessage(context, {
    before: args.before,
    channel,
    max: args.max,
  }, args.user);
}
