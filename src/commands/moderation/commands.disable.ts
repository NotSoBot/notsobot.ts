import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { createGuildDisabledCommand } from '../../api';
import { CommandTypes, GuildDisableCommandsTypes } from '../../constants';

import { BaseCommand } from '../basecommand';
import { Parameters } from '../../utils';


export interface CommandArgsBefore {
  channels: Array<Structures.Channel> | null,
  command: Command.Command | null,
  roles: Array<Structures.Role> | null,
  users: Array<Structures.Member | Structures.User> | null,
}

export interface CommandArgs {
  channels: Array<Structures.Channel> | null,
  command: Command.Command,
  roles: Array<Structures.Role> | null,
  users: Array<Structures.Member | Structures.User> | null,
}

export default class CommandsDisable extends BaseCommand {
  aliases = ['cmds disable'];
  name = 'commands disable';

  disableDm = true;
  label = 'command';
  metadata = {
    description: 'Disable a command for a Channel/Role/User or Server-Wide',
    examples: [
      'commands disable rule34',
      'commands disable rule34 -channels lobby',
      'commands disable rule34 -roles admin everyone',
    ],
    type: CommandTypes.MODERATION,
    usage: 'commands disable <command-name> (-channels ...<channel mention/name>) (-roles ...<role mention/name>) (-users ...<user mention/name>)',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.MANAGE_GUILD];
  type = (content: string, context: Command.Context) => context.commandClient.getCommand({content, prefix: ''});

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
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
        {aliases: ['role'], name: 'roles', type: Parameters.roles},
        {aliases: ['user'], name: 'users', type: Parameters.membersOrUsers({allowBots: false})},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
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

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
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
      return context.editOrReply(`⚠ Unable to find the provided ${errors.join(', ')}.`);
    }
    return context.editOrReply('⚠ Unknown Command');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { command } = args;
    const guildId = context.guildId as string;

    const isServerWide = !args.channels && !args.roles && !args.users;
    if (isServerWide) {
      await createGuildDisabledCommand(context, guildId, command.name, guildId, GuildDisableCommandsTypes.GUILD);
      return context.reply(`Ok, disabled ${command.name} server-wide.`);
    } else {
      // process all the channels/roles/users
    }
  }
}
