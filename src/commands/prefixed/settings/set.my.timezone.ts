import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set my timezone';

export default class SetMyTimezoneCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['set my tz'],
      args: [
        {name: 'clear', aliases: ['c'], type: Boolean},
      ],
      label: 'timezone',
      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'Set your default timezone, used for times in commands like reminders.',
        examples: [
          `${COMMAND_NAME} alaska`,
          `${COMMAND_NAME} pst`,
          `${COMMAND_NAME} -clear`,
        ],
        id: Formatter.Commands.SettingsSetTimezone.COMMAND_ID,
        usage: '<timezone> (-clear)',
      },
      type: Parameters.timezone,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.SettingsSetTimezone.CommandArgs) {
    // a timezone was given but didn't match any we support
    return !!args.clear || args.timezone !== null;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.SettingsSetTimezone.CommandArgs) {
    const { translateMaybe } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translateMaybe('params.unknown_timezone', 'Unknown timezone, try a city or an abbreviation like PST')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsSetTimezone.CommandArgs) {
    return Formatter.Commands.SettingsSetTimezone.createMessage(context, args);
  }
}
