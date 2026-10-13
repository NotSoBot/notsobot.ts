import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { displayReply } from '../../../utils';


export const COMMAND_ID = 'media.i.create.wordcloud.user';

export interface CommandArgs {
  channel: Structures.Channel,
  max?: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {

  return displayReply(context, {description: 'wip'});
}
