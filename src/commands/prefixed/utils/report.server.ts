import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, ReportTypes } from '../../../constants';
import { Formatter, Parameters, isSnowflake } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'report server';

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
      ratelimits: [
        {duration: 60000, limit: 1, key: Formatter.Commands.Report.COMMAND_ID, type: 'user'},
      ],
      type: Parameters.string({maxLength: Formatter.Commands.Report.MAX_CONTENT_LENGTH}),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { rest, target } = Formatter.Commands.Report.splitTarget(args.content);
    if (isSnowflake(target)) {
      return Formatter.Commands.Report.createMessage(context, {content: rest, server: target, type: ReportTypes.SERVER});
    }
    return Formatter.Commands.Report.createMessage(context, {content: args.content, type: ReportTypes.SERVER});
  }
}
