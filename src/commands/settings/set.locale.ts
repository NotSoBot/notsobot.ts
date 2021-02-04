import { Command, CommandClient, Constants } from 'detritus-client';
import { LocalesText, Permissions } from 'detritus-client/lib/constants';

import { CommandTypes } from '../../constants';
import { Arguments } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  locale: Constants.Locales | undefined,
}

export interface CommandArgs {
  locale: Constants.Locales,
}

export const COMMAND_NAME = 'set locale';

export default class SetLocaleCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['set language'],
      disableDm: true,
      label: 'locale',
      metadata: {
        description: 'Set the guild\'s locale preference.',
        examples: [
          `${COMMAND_NAME} en-us`,
          `${COMMAND_NAME} english`,
        ],
        type: CommandTypes.SETTINGS,
        usage:  '<locale>',
      },
      permissionsClient: [Permissions.MANAGE_GUILD],
      permissions: [Permissions.MANAGE_GUILD],
      type: Arguments.DiscordLocale.type!,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.locale;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Provide some kind of locale');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guild = context.guild;
    if (guild) {
      await guild.edit({preferredLocale: args.locale});

      let locale: string;
      if (args.locale in LocalesText) {
        locale = LocalesText[args.locale];
      } else {
        locale = args.locale;
      }
      return context.editOrReply(`Successfully changed the guild\'s locale to ${locale}`);
    }
  }
}
