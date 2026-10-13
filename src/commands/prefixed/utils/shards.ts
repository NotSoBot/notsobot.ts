import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'shards';

export default class ShardCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Show all of the bot\'s shard information',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.UTILITY,
        id: Formatter.Commands.UtilsShards.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.UtilsShards.createMessage(context);
  }
}
