import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildWarningAutoTriggers } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'autowarn blocked';

export interface CommandArgs {
  channel?: Structures.Channel | null,
  warnings?: number,
}

export default class AutowarnBlockedCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['autowarn commands'],
      args: [
        {name: 'channel', type: Parameters.channel({types: Formatter.Commands.ModerationAutowarn.CHANNEL_TYPES as any})},
        {name: 'warnings', aliases: ['warns', 'cost'], type: Number},
      ],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Warn members that use a command the server\'s rules block for them, server-wide or in a channel (covers its threads, or a category\'s channels)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -warnings 2`,
          `${COMMAND_NAME} -channel general`,
        ],
        id: Formatter.Commands.ModerationAutowarn.COMMAND_ID_BLOCKED,
        usage: '(-warnings <count>) (-channel <channel:id|mention|name>)',
      },
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    return args.channel !== null;
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ModerationAutowarn.createSetMessage(context, {
      channel: args.channel || null,
      trigger: GuildWarningAutoTriggers.BLOCKED_COMMAND,
      warnings: args.warnings,
    });
  }
}
