import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'set ban clean';

export default class SetBanCleanCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['set banclean'],
      disableDm: true,
      label: 'clean',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'See or change how far back a ban deletes messages when the moderator doesn\'t pick (default 24 hours, up to 7 days, or none)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 7d`,
          `${COMMAND_NAME} 6 hours`,
          `${COMMAND_NAME} none`,
        ],
        id: Formatter.Commands.SettingsServerSetBanClean.COMMAND_ID,
        usage: '?<duration|none>',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: Formatter.Commands.SettingsServerSetBanClean.cleanParser,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SettingsServerSetBanClean.CommandArgs) {
    return Formatter.Commands.SettingsServerSetBanClean.createMessage(context, args);
  }
}
