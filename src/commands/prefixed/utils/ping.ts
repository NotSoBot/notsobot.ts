import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

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
        id: Formatter.Commands.UtilsPing.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.UtilsPing.createMessage(context);
  }
}
