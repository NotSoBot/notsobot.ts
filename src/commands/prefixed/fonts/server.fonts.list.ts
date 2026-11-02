import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'server fonts';

export default class ServerFontsListCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['server fonts list'],

      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'List the server\'s saved fonts',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.ServerFontsList.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ServerFontsList.CommandArgs) {
    return Formatter.Commands.ServerFontsList.createMessage(context, args);
  }
}
