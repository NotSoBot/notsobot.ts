import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import {
  DefaultParameters,
  Formatter,
  Parameters,
  editOrReply,
} from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  user: Structures.Member | Structures.User,
}


export const COMMAND_NAME = 'user';

export default class UserCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['userinfo', 'member', 'memberinfo'],
      default: DefaultParameters.author,
      label: 'user',
      metadata: {
        category: CommandCategories.INFO,
        description: 'Get information about a user, defaults to self',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} cake#1`,
          `${COMMAND_NAME} <@439205512425504771>`,
        ],
        id: Formatter.Commands.InfoUser.COMMAND_ID,
        usage: '?<user:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.memberOrUser(),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.user;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    return editOrReply(context, '⚠ Unable to find that user.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.InfoUser.createMessage(context, args);
  }
}
