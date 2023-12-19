import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'interrogate';

export default class InterrogateCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['identify'],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Generate a prompt from an Image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.ToolsMLInterrogate.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsMLInterrogate.CommandArgs) {
    return Formatter.Commands.ToolsMLInterrogate.createMessage(context, args);
  }
}
