import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { BooleanEmojis, CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'applications';

export default class ApplicationsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['application', 'games', 'game', 'applicationinfo', 'gameinfo'],
      label: 'applications',
      metadata: {
        description: 'Get information about multiple (or one) application (Uses the same list Discord does)',
        examples: [
          `${COMMAND_NAME} rust`,
          `${COMMAND_NAME} 356888738724446208`,
        ],
        category: CommandCategories.INFO,
        id: Formatter.Commands.InfoApplications.COMMAND_ID,
        usage: '?<application:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.applications,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoApplications.CommandArgsBefore) {
    return !!args.applications.length;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.InfoApplications.CommandArgsBefore) {
    return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find that game.`);
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoApplications.CommandArgs) {
    return Formatter.Commands.InfoApplications.createMessage(context, args);
  }
}
