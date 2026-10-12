import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'say';

export default class SayCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'text',
      metadata: {
        description: 'Have the bot say something (owner only because exploits)',
        examples: [
          `${COMMAND_NAME} :spider:`,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerSay.COMMAND_ID,
        usage: '<text>',
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context, args: Formatter.Commands.OwnerSay.CommandArgs) {
    return Formatter.Commands.OwnerSay.createMessage(context, args);
  }
}
