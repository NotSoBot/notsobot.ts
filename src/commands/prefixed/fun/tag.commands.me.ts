import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'tag commands me';

export default class TagCommandsListMeCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t commands me'],
      metadata: {
        category: CommandCategories.FUN,
        description: 'List all of your global custom commands',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.TagCommandsListMe.COMMAND_ID,
        usage: '?<user:id|mention|name>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.TagCommandsListMe.CommandArgs) {
    return Formatter.Commands.TagCommandsListMe.createMessage(context, args);
  }
}
