import { Command, CommandClient } from 'detritus-client';

import { CommandTypes, GoogleLocales } from '../../../constants';
import { Arguments, Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  locale?: GoogleLocales,
}

export interface CommandArgs {
  locale: GoogleLocales,
}

export const COMMAND_NAME = 'set my locale';

export default class SetMyLocaleCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['set my language'],
      default: null,
      label: 'locale',
      metadata: {
        description: 'Set your default language preference.',
        examples: [
          `${COMMAND_NAME} en-us`,
          `${COMMAND_NAME} german`,
        ],
        type: CommandTypes.SETTINGS,
        usage: '<locale>',
      },
      type: Arguments.GoogleLocale.type,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.locale;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Provide some kind of language');
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.SettingsMeLocale.createMessage(context, {locale: args.locale});
  }
}
