import { Collections, Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { deleteGuildDisabledCommand, editGuildSettings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { CommandTypes, GuildDisableCommandsTypes } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { createDisabledCommandsEmbed } from './commands';


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

export const COMMAND_NAME = 'commands enable';

export default class CommandsEnable extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds enable'],
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
        description: 'Re-enable a command for a Channel/Role/User or Server-Wide',
        examples: [
          `${COMMAND_NAME} rule34`,
          `${COMMAND_NAME} rule34 -channels lobby`,
          `${COMMAND_NAME} rule34 -roles admin everyone`,
        ],
        type: CommandTypes.MODERATION,
        usage: '<command-name> (-channels ...<channel:id|mention|name>) (-roles ...<role:id|mention|name>) (-users ...<user:id|mention|name>)',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      type: (content: string, context: Command.Context) => {
        return context.commandClient.getCommand({content, prefix: ''});
      },
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

    let settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;

    let title = `Enabled ${command.name}`;
    if (isServerWide) {
      title = `${title} server-wide`;
      await deleteGuildDisabledCommand(context, guildId, command.name, guildId, GuildDisableCommandsTypes.GUILD);
      settings = await GuildSettingsStore.fetch(context, guildId) as GuildSettings;
    } else {
      let channels = 0, roles = 0, users = 0;

      const payloads = [];
      if (args.channels) {
        channels = args.channels.length;
        for (let channel of args.channels) {
          payloads.push({item: channel, type: GuildDisableCommandsTypes.CHANNEL});
        }
      }
      if (args.roles) {
        roles = args.roles.length;
        for (let role of args.roles) {
          payloads.push({item: role, type: GuildDisableCommandsTypes.ROLE});
        }
      }
      if (args.users) {
        users = args.users.length;
        for (let user of args.users) {
          payloads.push({item: user, type: GuildDisableCommandsTypes.USER});
        }
      }

      for (let payload of payloads) {
        const key = `${command.name}.${payload.item.id}.${payload.type}`;
        if (settings.disabledCommands.has(key)) {
          await deleteGuildDisabledCommand(context, guildId, command.name, payload.item.id, payload.type);
        }
      }
      settings = await GuildSettingsStore.fetch(context, guildId) as GuildSettings;

      const comments: Array<string> = [];
      if (channels) {
        comments.push(`${channels.toLocaleString()} Channel${(channels === 1) ? '' : 's'}`);
      }
      if (roles) {
        comments.push(`${roles.toLocaleString()} Role${(roles === 1) ? '' : 's'}`);
      }
      if (users) {
        comments.push(`${users.toLocaleString()} Users${(users === 1) ? '' : 's'}`);
      }
      title = `${title} for ${comments.join(', ')}`;

      /*
      if (payloads.length === 1) {
        // do single
        const [ payload ] = payloads;
        await deleteGuildDisabledCommand(context, guildId, command.name, payload.item.id, payload.type);
        settings = await GuildSettingsStore.fetch(context, guildId) as GuildSettings;
      } else {
        // do multiple
        settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;

        const disabledCommands = new Collections.BaseCollection<string, {command: string, id: string, type: string}>();
        for (let [key, disabled] of settings.disabledCommands) {
          disabledCommands.set(key, {command: command.name, id: disabled.id, type: disabled.type});
        }
        for (let {item, type} of payloads) {
          const key = `${command.name}.${item.id}.${type}`;
          disabledCommands.delete(key);
        }
        settings = await editGuildSettings(context, guildId, {
          disabledCommands: disabledCommands.toArray(),
        });
      }
      */
    }
    return createDisabledCommandsEmbed(context, settings.disabledCommands, {title})
  }
}
