import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag commands';

export default class TagCommandsListCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t commands'],
      metadata: {
        category: CommandCategories.FUN,
        description: 'List all of the current server\'s custom commands',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.TagCommandsList.COMMAND_ID,
        usage: '?<user:id|mention|name>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.TagCommandsList.CommandArgs) {
    return Formatter.Commands.TagCommandsList.createMessage(context, args);
  }
}
