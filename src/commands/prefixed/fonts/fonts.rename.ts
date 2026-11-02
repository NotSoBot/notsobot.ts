import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'fonts rename';

export default class FontsRenameCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['font rename'],

      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'Rename one of your saved fonts',
        examples: [
          `${COMMAND_NAME} comic comic_sans`,
        ],
        id: Formatter.Commands.FontsRename.COMMAND_ID,
        usage: '<name> <new name>',
      },
      type: [
        {name: 'name'},
        {name: 'newName', consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Omit<Formatter.Commands.FontsRename.CommandArgs, 'server'>) {
    return !!args.name && !!args.newName;
  }

  async run(context: Command.Context, args: Omit<Formatter.Commands.FontsRename.CommandArgs, 'server'>) {
    return Formatter.Commands.FontsRename.createMessage(context, args);
  }
}
