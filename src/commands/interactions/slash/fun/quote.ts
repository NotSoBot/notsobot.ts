import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'quote';

export interface CommandArgs {
  compact?: boolean,
  light?: boolean,
  message?: Parameters.QuoteTarget,
  text?: string,
  user?: Formatter.Commands.FunQuote.CommandArgs['user'],
}

export class QuoteCommand extends BaseInteractionCommandOption {
  description = 'Turn a message (or some text) into an image of a Discord message';
  descriptionLocalizations = I18n.localizations('commands.fun.quote.description');
  metadata = {
    id: Formatter.Commands.FunQuote.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.quote.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'What it says',
          ...I18n.optionLocalizations('commands.fun.quote.text'),
        },
        {
          name: 'user',
          description: 'Who says it (their latest message without text)',
          ...I18n.optionLocalizations('commands.fun.quote.user'),
          type: ApplicationCommandOptionTypes.USER,
        },
        {
          name: 'message',
          description: 'A message link or id to quote',
          ...I18n.optionLocalizations('commands.fun.quote.message'),
          value: Parameters.quote,
        },
        {
          name: 'compact',
          description: 'Discord\'s compact mode, the name inline with the text',
          ...I18n.optionLocalizations('commands.fun.quote.compact'),
          type: Boolean,
        },
        {
          name: 'light',
          description: 'Discord\'s light theme',
          ...I18n.optionLocalizations('commands.fun.quote.light'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.FunQuote.createMessage(context, {
      compact: args.compact,
      light: args.light,
      message: (args.message) ? args.message.message : null,
      text: args.text,
      user: args.user,
    });
  }
}
