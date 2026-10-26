import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MAX_GUILD_REPORT_REASON_LENGTH } from '../../../constants';
import { Formatter, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'report';

export interface CommandArgs {
  content: string,
}

export default class GuildReportCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'content',
      metadata: {
        category: CommandCategories.UTILITY,
        description: 'Report a member to this server\'s moderators, or reply to one of their messages to report it',
        examples: [
          `${COMMAND_NAME} @someone keeps sending slurs in general`,
          `${COMMAND_NAME} 300505364032389122 spamming invites in my dms`,
        ],
        id: Formatter.Commands.GuildReport.COMMAND_ID,
        usage: '<user:id|mention|name> <reason>',
      },
      // the user's mention or id is in here too
      type: Parameters.string({maxLength: MAX_GUILD_REPORT_REASON_LENGTH + 100}),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    // replying to a message reports it, the whole text is the reason
    const reference = context.message.messageReference;
    const replied = (reference && reference.message && reference.message.guildId === context.guildId) ? reference.message : null;

    let result: Awaited<ReturnType<typeof Formatter.Commands.GuildReport.createReport>>;
    if (replied) {
      result = await Formatter.Commands.GuildReport.createReport(context, {message: replied, reason: args.content});
    } else {
      const { rest, target } = Formatter.Commands.Report.splitTarget(args.content);
      const user = (target) ? await Parameters.memberOrUser()(target, context) : undefined;
      result = await Formatter.Commands.GuildReport.createReport(context, {reason: rest, user});
    }
    const reply = await displayReply(context, result.payload);
    // there's no keeping it between them and the moderators here, so the report at least doesn't stay in the chat
    if (result.report) {
      await context.message.delete().catch(() => {});
    }
    return reply;
  }
}
