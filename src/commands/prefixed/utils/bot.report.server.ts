import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, ReportTypes } from '../../../constants';
import { Formatter, Parameters, isSnowflake } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { sendReport } from './bot.report.bug';


export const COMMAND_NAME = 'bot report server';

export interface CommandArgs {
  content: string,
}

export default class ReportServerCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'content',
      metadata: {
        category: CommandCategories.UTILITY,
        description: 'Report a server abusing NotSoBot to the developers, defaults to the current server',
        examples: [
          `${COMMAND_NAME} this server uses the bot to spread nsfw`,
          `${COMMAND_NAME} 178313653177548800 uses the bot to raid other servers`,
        ],
        id: Formatter.Commands.Report.COMMAND_ID_SERVER,
        usage: '?<server:id> <reason>',
      },
      priority: -1,
      type: Parameters.string({maxLength: Formatter.Commands.Report.MAX_CONTENT_LENGTH}),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { rest, target } = Formatter.Commands.Report.splitTarget(args.content);
    if (isSnowflake(target)) {
      return sendReport(this, context, {content: rest, server: target, type: ReportTypes.SERVER});
    }
    return sendReport(this, context, {content: args.content, type: ReportTypes.SERVER});
  }
}
