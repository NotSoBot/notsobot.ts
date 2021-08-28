import { Command, CommandClient } from 'detritus-client';
import { Locales as DiscordLocales, LocalesText, Permissions } from 'detritus-client/lib/constants';

import { CommandTypes } from '../../../constants';
import { Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  locale?: DiscordLocales,
}

export interface CommandArgs {
  locale: DiscordLocales,
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
        description: 'Set the guild\'s language preference.',
        examples: [
          `${COMMAND_NAME} en-us`,
          `${COMMAND_NAME} german`,
        ],
        type: CommandTypes.SETTINGS,
        usage: '<locale>',
      },
      permissionsClient: [Permissions.MANAGE_GUILD],
      permissions: [Permissions.MANAGE_GUILD],
      type: Parameters.localeDiscord,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.locale;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return context.editOrReply('⚠ Provide some kind of language');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guild = context.guild;
    if (guild) {
      await guild.edit({preferredLocale: args.locale});

      let text: string = args.locale;
      if (args.locale in LocalesText) {
        text = LocalesText[args.locale];
      }
      return context.editOrReply(`Successfully changed the guild\'s locale to ${text}`);
    }
  }
}
