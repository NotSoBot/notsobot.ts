import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'premium servers add';

export default class PremiumServersAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'Give this server your NotSoPremium Plus perks, up to 2 servers.',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.PremiumServersAdd.COMMAND_ID,
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.PremiumServersAdd.CommandArgs) {
    return Formatter.Commands.PremiumServersAdd.createMessage(context, args);
  }
}
