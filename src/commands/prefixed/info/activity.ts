import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'activity';

export default class ActivityCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['presence'],
      default: DefaultParameters.author,
      label: 'user',
      metadata: {
        description: 'Get a user\'s current activity, defaults to self',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.INFO,
        id: Formatter.Commands.InfoActivity.COMMAND_ID,
        usage: '?<user:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.memberOrUser(),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoActivity.CommandArgsBefore) {
    return !!args.user;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.InfoActivity.CommandArgsBefore) {
    return editOrReply(context, `${StatusEmojis.WARNING} Unable to find that user.`);
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoActivity.CommandArgs) {
    return Formatter.Commands.InfoActivity.createMessage(context, args);
  }
}
