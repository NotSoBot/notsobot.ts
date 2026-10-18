import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set timezone';

export default class SetTimezoneCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'clear', aliases: ['c'], type: Boolean},
      ],
      disableDm: true,
      label: 'timezone',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Change your guild\'s timezone for commands/logging purposes',
        examples: [
          `${COMMAND_NAME} alaska`,
          `${COMMAND_NAME} mst`,
        ],
        id: Formatter.Commands.SettingsServerSetTimezone.COMMAND_ID,
        usage: '<timezone> (-clear)',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: Parameters.timezone,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.SettingsServerSetTimezone.CommandArgs) {
    // a timezone was given but didn't match any we support
    return args.timezone !== null;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.SettingsServerSetTimezone.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('params.unknown_timezone')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsServerSetTimezone.CommandArgs) {
    return Formatter.Commands.SettingsServerSetTimezone.createMessage(context, args);
  }
}
