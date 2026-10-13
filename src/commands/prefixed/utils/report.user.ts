import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, ReportTypes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'report user';

export interface CommandArgs {
  content: string,
}

export default class ReportUserCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'content',
      metadata: {
        category: CommandCategories.UTILITY,
        description: 'Report a user abusing NotSoBot to the developers',
        examples: [
          `${COMMAND_NAME} @someone using the bot to spam slurs`,
          `${COMMAND_NAME} 300505364032389122 making nsfw images in sfw channels`,
        ],
        id: Formatter.Commands.Report.COMMAND_ID_USER,
        usage: '<user:id|mention> <reason>',
      },
      priority: -1,
      ratelimits: [
        {duration: 60000, limit: 1, key: Formatter.Commands.Report.COMMAND_ID, type: 'user'},
      ],
      type: Parameters.string({maxLength: Formatter.Commands.Report.MAX_CONTENT_LENGTH}),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { rest, target } = Formatter.Commands.Report.splitTarget(args.content);
    const user = (target) ? await Parameters.memberOrUser()(target, context) : undefined;
    return Formatter.Commands.Report.createMessage(context, {
      content: rest,
      type: ReportTypes.USER,
      user,
    });
  }
}
