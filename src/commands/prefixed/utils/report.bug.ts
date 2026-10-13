import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, ReportTypes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'report bug';

export interface CommandArgs {
  content: string,
}

export default class ReportBugCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'content',
      metadata: {
        category: CommandCategories.UTILITY,
        description: 'Send a bug report to the NotSoBot developers',
        examples: [
          `${COMMAND_NAME} the caption command cuts off long text`,
        ],
        id: Formatter.Commands.Report.COMMAND_ID_BUG,
        usage: '<description>',
      },
      priority: -1,
      ratelimits: [
        {duration: 60000, limit: 1, key: Formatter.Commands.Report.COMMAND_ID, type: 'user'},
      ],
      type: Parameters.string({maxLength: Formatter.Commands.Report.MAX_CONTENT_LENGTH}),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.Report.createMessage(context, {
      content: args.content,
      type: ReportTypes.BUG,
    });
  }
}
