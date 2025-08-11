import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GoogleLocales } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set my locale';

export default class SetMyLocaleCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['set my language'],
      default: null,
      label: 'locale',
      metadata: {
        category: CommandCategories.SETTINGS,
        description: 'Set your default language preference.',
        examples: [
          `${COMMAND_NAME} en-us`,
          `${COMMAND_NAME} german`,
        ],
        id: Formatter.Commands.SettingsSetLocale.COMMAND_ID,
        usage: '<locale>',
      },
      type: Parameters.locale,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.SettingsSetLocale.CommandArgs) {
    return !!args.locale;
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsSetLocale.CommandArgs) {
    return Formatter.Commands.SettingsSetLocale.createMessage(context, {locale: args.locale});
  }
}
