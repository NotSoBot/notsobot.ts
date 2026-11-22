import { Command, Interaction } from 'detritus-client';

import { displayReply } from '../../../utils';


export const COMMAND_ID = 'bot.invite';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  // `src` says the invite came from the bot: the API keeps it with the invite and the site's analytics read it
  return displayReply(context, {description: '<https://notsobot.com/invite?src=bot-invite>'});
}
