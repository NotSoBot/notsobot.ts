import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'decoy remove';

export interface CommandArgs {
  'delete-channel'?: boolean,
}

export default class DecoyRemoveCommand extends BaseCommand {
  permissionsIgnoreClientOwner = false;

  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['decoy delete'],
      args: [
        {name: 'delete-channel', type: Boolean},
      ],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Stop using the decoy channel. It stays as a normal channel unless -delete-channel is given',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -delete-channel`,
        ],
        id: Formatter.Commands.ServerDecoy.COMMAND_ID_REMOVE,
        usage: '(-delete-channel)',
      },
      permissions: [Permissions.MANAGE_GUILD, Permissions.BAN_MEMBERS],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ServerDecoy.createRemoveMessage(context, args);
  }
}
