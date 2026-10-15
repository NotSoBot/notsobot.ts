import { Command, CommandClient, CommandRatelimit } from 'detritus-client';

import { CommandCategories, ReportTypes } from '../../../constants';
import { Formatter, Parameters, isSnowflake } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'report bug';

export interface CommandArgs {
  content: string,
}

// shared 60s ratelimit between `report bug`, `report server`, `report user`, and `tag report`, checked by hand so it's only consumed once
// a valid report is about to be sent (a typo used to lock the user out for a minute)
export const REPORT_RATELIMIT = new CommandRatelimit.CommandRatelimit({
  duration: 60000,
  key: Formatter.Commands.Report.COMMAND_ID,
  limit: 1,
  type: 'user',
});

// mirrors the checks in `Formatter.Commands.Report.createPayload`, invalid reports go straight to it for the warning
export function isValidReport(context: Command.Context, args: Formatter.Commands.Report.CommandArgs): boolean {
  if (!(args.content || '').trim()) {
    return false;
  }
  switch (args.type) {
    case ReportTypes.USER: {
      return !!args.user && args.user.id !== context.userId;
    };
    case ReportTypes.SERVER: {
      const serverId = args.server || context.guildId;
      return !!serverId && isSnowflake(serverId);
    };
    case ReportTypes.TAG: {
      return !!args.tag && args.tag.user.id !== context.userId;
    };
  }
  return true;
}

export async function sendReport(
  command: BaseCommand,
  context: Command.Context,
  args: Formatter.Commands.Report.CommandArgs,
) {
  if (isValidReport(context, args)) {
    const now = Date.now();
    const ratelimits = context.commandClient.ratelimiter.getExceeded(context, [REPORT_RATELIMIT], now);
    if (ratelimits.length) {
      return command.onRatelimit(context, ratelimits, {global: false, now});
    }
  }
  return Formatter.Commands.Report.createMessage(context, args);
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
      type: Parameters.string({maxLength: Formatter.Commands.Report.MAX_CONTENT_LENGTH}),
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return sendReport(this, context, {
      content: args.content,
      type: ReportTypes.BUG,
    });
  }
}
