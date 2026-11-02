import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set my font';

export default class SetMyFontCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'clear', aliases: ['c'], type: Boolean},
      ],
      label: 'font',
      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'Set your default font for caption, meme and recaption',
        examples: [
          `${COMMAND_NAME} impact`,
          `${COMMAND_NAME} -clear`,
        ],
        id: Formatter.Commands.SettingsSetFont.COMMAND_ID,
        usage: '<font> (-clear)',
      },
      // a bundled font, or one of their own saved fonts
      type: Parameters.mediaFontUser,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsSetFont.CommandArgs) {
    return Formatter.Commands.SettingsSetFont.createMessage(context, args);
  }
}
