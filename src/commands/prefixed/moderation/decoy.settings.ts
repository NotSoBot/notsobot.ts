import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'decoy settings';

export interface CommandArgs {
  bait?: boolean,
  clean?: number | null,
  interval?: number,
  topic?: string,
}

export default class DecoySettingsCommand extends BaseCommand {
  permissionsIgnoreClientOwner = false;

  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['decoy set'],
      args: [
        {name: 'clean', type: Formatter.Commands.ServerDecoy.cleanParser},
        {name: 'bait', type: Formatter.Commands.ServerDecoy.baitParser},
        {name: 'interval', type: Formatter.Commands.ServerDecoy.intervalParser},
        {name: 'topic', type: String},
      ],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Change how far back the decoy deletes their messages (default: the server\'s `set ban clean`), the bait that makes the channel look used, and its topic',
        examples: [
          `${COMMAND_NAME} -clean 1d`,
          `${COMMAND_NAME} -clean default`,
          `${COMMAND_NAME} -bait off`,
          `${COMMAND_NAME} -interval 2h`,
          `${COMMAND_NAME} -topic none`,
        ],
        id: Formatter.Commands.ServerDecoy.COMMAND_ID_SETTINGS,
        usage: '(-clean <duration>|none|default) (-bait <on|off>) (-interval <duration>) (-topic <text>|none)',
      },
      permissions: [Permissions.MANAGE_GUILD, Permissions.BAN_MEMBERS],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ServerDecoy.createSettingsMessage(context, args);
  }
}
