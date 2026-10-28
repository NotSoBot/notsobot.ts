import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, ReportStatuses } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'reports';

export interface CommandArgs {
  status: ReportStatuses | null,
}

export default class ReportsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'status',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'See members\' reports to this server\'s moderators, or only the ones with a status',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} open`,
        ],
        id: Formatter.Commands.ModerationReports.COMMAND_ID,
        usage: '?<open|resolved|dismissed>',
      },
      permissions: [Permissions.MODERATE_MEMBERS],
      type: Parameters.oneOf({
        choices: {OPEN: ReportStatuses.OPEN, RESOLVED: ReportStatuses.RESOLVED, DISMISSED: ReportStatuses.DISMISSED},
        descriptions: {[ReportStatuses.OPEN]: 'open', [ReportStatuses.RESOLVED]: 'resolved', [ReportStatuses.DISMISSED]: 'dismissed'},
      }),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ModerationReports.createMessage(context, {status: args.status ?? undefined});
  }
}
