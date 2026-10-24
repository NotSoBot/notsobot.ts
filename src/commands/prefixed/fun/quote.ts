import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'quote';

export interface CommandArgsBefore {
  compact?: boolean,
  light?: boolean,
  target: Parameters.QuoteTarget,
}

export default class QuoteCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'compact', type: Boolean},
        {name: 'light', type: Boolean},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FUN,
        description: 'Turn a message (or some text) into an image of a Discord message',
        examples: [
          `${COMMAND_NAME} hello world`,
          `${COMMAND_NAME} @notsobot I'm a bot`,
          `${COMMAND_NAME} @notsobot`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
          `${COMMAND_NAME} hello world -light -compact`,
        ],
        id: Formatter.Commands.FunQuote.COMMAND_ID,
        usage: '<text | @user [text] | message link/id> (-compact) (-light)',
      },
      type: Parameters.quote,
    });
  }

  // a reply with nothing else quotes the replied to message
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.user || args.target.text);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunQuote.createMessage(context, {
      compact: args.compact,
      light: args.light,
      message: args.target.message,
      text: args.target.text,
      user: args.target.user,
    });
  }
}
