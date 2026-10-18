import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'bans';

export default class BansCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'timed', aliases: ['t'], type: Boolean},
      ],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'List the server\'s bans, with when the timed ones (from `ban -for`) get lifted',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -timed`,
        ],
        id: Formatter.Commands.ServerBans.COMMAND_ID,
        usage: '(-timed)',
      },
      permissionsClient: [Permissions.BAN_MEMBERS],
      permissions: [Permissions.BAN_MEMBERS],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ServerBans.CommandArgs) {
    return Formatter.Commands.ServerBans.createMessage(context, args);
  }
}
