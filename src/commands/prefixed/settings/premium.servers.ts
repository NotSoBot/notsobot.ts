import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'premium servers';

export default class PremiumServersCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'See the servers you gave your NotSoPremium Plus to.',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.PremiumServers.COMMAND_ID,
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.PremiumServers.CommandArgs) {
    return Formatter.Commands.PremiumServers.createMessage(context, args);
  }
}
