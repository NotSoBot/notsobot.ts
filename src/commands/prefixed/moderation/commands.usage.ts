import { Command, CommandClient } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildCommandsBlocklistTypes } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'commands usage';

export default class CommandsUsageCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds usage'],
      args: [
        {
          name: 'channel',
          type: Parameters.channel({
            types: [
              ChannelTypes.GUILD_TEXT,
            ],
          }),
        },
        {
          name: 'user',
          type: Parameters.memberOrUser({allowBots: false}),
        },
      ],
      label: 'command',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Show the latest commands used by the Server',
        examples: [
          `${COMMAND_NAME} rule34`,
          `${COMMAND_NAME} rule34 -channel lobby`,
          `${COMMAND_NAME} rule34 -user cake`,
        ],
        id: Formatter.Commands.ModerationCommandsUsage.COMMAND_ID,
        usage: '<command-name> (-channel <channel:id|mention|name>) (-user <user:id|mention|name>)',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      //type: Parameters.prefixedCommand,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationCommandsUsage.CommandArgsBefore) {
    if (args.channel !== undefined && !args.channel) {
      return false;
    }
    if (args.user !== undefined && !args.user) {
      return false;
    }
    return true;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationCommandsUsage.CommandArgsBefore) {
    let errors: Array<string> = [];
    if (args.channel !== undefined && !args.channel) {
      errors.push('channel');
    }
    if (args.user !== undefined && !args.user) {
      errors.push('user');
    }
    if (errors.length) {
      return editOrReply(context, `⚠ Unable to find the provided ${errors.join(', ')}.`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationCommandsUsage.CommandArgs) {
    return Formatter.Commands.ModerationCommandsUsage.createMessage(context, args);
  }
}
