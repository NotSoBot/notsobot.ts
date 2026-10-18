import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'invites';

export default class InvitesCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'List the server\'s active invites, most used first',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.ServerInvites.COMMAND_ID,
        usage: '',
      },
      permissionsClient: [Permissions.MANAGE_GUILD],
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ServerInvites.CommandArgs) {
    return Formatter.Commands.ServerInvites.createMessage(context, args);
  }
}
