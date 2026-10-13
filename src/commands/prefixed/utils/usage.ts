import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'usage';

export default class UsageCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Show the bot\'s current usage (and Discord object counts)',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.UTILITY,
        id: Formatter.Commands.UtilsUsage.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.UtilsUsage.createMessage(context);
  }
}
