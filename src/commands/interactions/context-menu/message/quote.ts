import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs } from '../../basecommand';


export const COMMAND_NAME = 'Quote';

// the message as an image, posted for everyone (it's meant to be shared, unlike the other message context menus)
export default class QuoteCommand extends BaseContextMenuMessageCommand {
  metadata = {
    id: Formatter.Commands.FunQuote.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.context.quote.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  async run(context: Interaction.InteractionContext, args: ContextMenuMessageArgs) {
    return Formatter.Commands.FunQuote.createMessage(context, {message: args.message});
  }
}
