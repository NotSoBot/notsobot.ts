import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'shardsleft';

export default class ShardsLeftCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'See how many identifies we have left and when it\'ll reset',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerShardsLeft.COMMAND_ID,
        usage: '',
      },
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context) {
    return Formatter.Commands.OwnerShardsLeft.createMessage(context);
  }
}
