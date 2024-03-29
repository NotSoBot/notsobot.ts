import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'ping';

export default class PingCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Ping Discord\'s Gateway and Rest Api',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.UTILS,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    const { gateway, rest } = await context.client.ping();
    return editOrReply(context, `pong! (gateway: ${gateway}ms) (rest: ${rest}ms)`);
  }
}
