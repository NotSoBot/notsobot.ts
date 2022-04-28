import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set timezone';

export default class SetTimezoneCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'timezone',
      metadata: {
        category: CommandCategories.SETTINGS,
        description: 'Change your guild\'s timezone for commands/logging purposes',
        examples: [
          `${COMMAND_NAME} alaska`,
          `${COMMAND_NAME} mst`,
        ],
        id: Formatter.Commands.SettingsServerSetTimezone.COMMAND_ID,
        usage: '<timezone>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      type: Parameters.string({maxLength: 128}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.SettingsServerSetTimezone.CommandArgs) {
    return !!args.timezone;
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsServerSetTimezone.CommandArgs) {
    return Formatter.Commands.SettingsServerSetTimezone.createMessage(context, args);
  }
}
