import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'premium servers remove';

export default class PremiumServersRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'server',
      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'Take your NotSoPremium Plus perks off of a server (this one if none is given).',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 2`,
        ],
        id: Formatter.Commands.PremiumServersRemove.COMMAND_ID,
        usage: '?<server:number|id>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.PremiumServersRemove.CommandArgs) {
    return Formatter.Commands.PremiumServersRemove.createMessage(context, args);
  }
}
