import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set font';

export default class SetFontCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'clear', aliases: ['c'], type: Boolean},
      ],
      disableDm: true,
      label: 'font',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Set the server\'s default font for caption, meme and recaption',
        examples: [
          `${COMMAND_NAME} impact`,
          `${COMMAND_NAME} -clear`,
        ],
        id: Formatter.Commands.SettingsServerSetFont.COMMAND_ID,
        usage: '<font> (-clear)',
      },
      permissions: [Permissions.MANAGE_GUILD],
      // a bundled font, or one of the server's saved fonts
      type: Parameters.mediaFontServer,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsServerSetFont.CommandArgs) {
    return Formatter.Commands.SettingsServerSetFont.createMessage(context, args);
  }
}
