import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { BooleanEmojis, CommandCategories, GuildCommandsAllowlistTypes } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'commands allowlist add';

export default class CommandsAllowlistAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds allowlist add'],
      args: [
        {
          aliases: ['channel'],
          name: 'channels',
          type: Parameters.channels({
            types: [
              ChannelTypes.GUILD_CATEGORY,
              ChannelTypes.GUILD_NEWS,
              ChannelTypes.GUILD_TEXT,
            ],
          }),
        },
        {
          aliases: ['role'],
          name: 'roles',
          type: Parameters.roles,
        },
        {
          aliases: ['user'],
          name: 'users',
          type: Parameters.membersOrUsers({allowBots: false}),
        },
      ],
      disableDm: true,
      label: 'command',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Add a command to an allowlist for a Channel/Role/User or Server-Wide',
        examples: [
          `${COMMAND_NAME} rule34`,
          `${COMMAND_NAME} rule34 -channels lobby`,
          `${COMMAND_NAME} rule34 -roles members everyone`,
        ],
        id: Formatter.Commands.ModerationCommandsAllowlistAdd.COMMAND_ID,
        usage: '<command-name> (-channels ...<channel:id|mention|name>) (-roles ...<role:id|mention|name>) (-users ...<user:id|mention|name>)',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      type: Parameters.prefixedCommand,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationCommandsAllowlistAdd.CommandArgsBefore) {
    if (!args.command) {
      return false;
    }
    if (args.channels && !args.channels.length) {
      return false;
    }
    if (args.roles && !args.roles.length) {
      return false;
    }
    if (args.users && !args.users.length) {
      return false;
    }
    return true;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationCommandsAllowlistAdd.CommandArgsBefore) {
    if (args.command) {
      let errors: Array<string> = [];
      if (args.channels && !args.channels.length) {
        errors.push('channels');
      }
      if (args.roles && !args.roles.length) {
        errors.push('roles');
      }
      if (args.users && !args.users.length) {
        errors.push('users');
      }
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find the provided ${errors.join(', ')}.`);
    }
    return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Command`);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationCommandsAllowlistAdd.CommandArgs) {
    return Formatter.Commands.ModerationCommandsAllowlistAdd.createMessage(context, args);
  }
}
