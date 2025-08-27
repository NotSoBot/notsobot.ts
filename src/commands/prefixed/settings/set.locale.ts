import { Command, CommandClient } from 'detritus-client';
import { Locales as DiscordLocales, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set locale';

export default class SetLocaleCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['set language'],
      args: [
        {name: 'clear', aliases: ['c'], type: Boolean},
      ],
      disableDm: true,
      label: 'locale',
      metadata: {
        category: CommandCategories.SETTINGS,
        description: 'Set the guild\'s language preference.',
        examples: [
          `${COMMAND_NAME} en-us`,
          `${COMMAND_NAME} german`,
        ],
        id: Formatter.Commands.SettingsServerSetLocale.COMMAND_ID,
        usage: '<locale> (-clear)',
      },
      permissionsClient: [Permissions.MANAGE_GUILD],
      permissions: [Permissions.MANAGE_GUILD],
      type: Parameters.localeDiscord,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsServerSetLocale.CommandArgs) {
    return Formatter.Commands.SettingsServerSetLocale.createMessage(context, args);
  }
}
