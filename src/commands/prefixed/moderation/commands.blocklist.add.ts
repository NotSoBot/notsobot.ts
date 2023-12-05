import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildCommandsBlocklistTypes } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'commands blocklist add';

export default class CommandsBlocklistAddCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds blocklist add'],
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
        description: 'Block a command for a Channel/Role/User or Server-Wide',
        examples: [
          `${COMMAND_NAME} rule34`,
          `${COMMAND_NAME} rule34 -channels lobby`,
          `${COMMAND_NAME} rule34 -roles members everyone`,
        ],
        id: Formatter.Commands.ModerationCommandsBlocklistAdd.COMMAND_ID,
        usage: '<command-name> (-channels ...<channel:id|mention|name>) (-roles ...<role:id|mention|name>) (-users ...<user:id|mention|name>)',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      type: (content: string, context: Command.Context) => {
        return context.commandClient.getCommand({content, prefix: ''});
      },
    });
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationCommandsBlocklistAdd.CommandArgsBefore) {
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
      return editOrReply(context, `⚠ Unable to find the provided ${errors.join(', ')}.`);
    }
    return editOrReply(context, '⚠ Unknown Command');
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationCommandsBlocklistAdd.CommandArgs) {
    return Formatter.Commands.ModerationCommandsBlocklistAdd.createMessage(context, args);
  }
}
