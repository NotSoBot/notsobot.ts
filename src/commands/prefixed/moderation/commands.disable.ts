import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { createGuildDisabledCommand, editGuildSettings } from '../../../api';
import { GuildSettings } from '../../../api/structures/guildsettings';
import { CommandCategories, GuildDisableCommandsTypes } from '../../../constants';
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

export const COMMAND_NAME = 'commands disable';

export default class CommandsDisable extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds disable'],
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
        description: 'Disable a command for a Channel/Role/User or Server-Wide',
        examples: [
          `${COMMAND_NAME} rule34`,
          `${COMMAND_NAME} rule34 -channels lobby`,
          `${COMMAND_NAME} rule34 -roles members everyone`,
        ],
        category: CommandCategories.MODERATION,
        usage: '<command-name> (-channels ...<channel:id|mention|name>) (-roles ...<role:id|mention|name>) (-users ...<user:id|mention|name>)',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      type: (content: string, context: Command.Context) => {
        return context.commandClient.getCommand({content, prefix: ''});
      },
    });
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
    const commandId = (command.metadata && command.metadata.id) ? command.metadata.id : command.name.split(' ').join('.');
    const guildId = context.guildId as string;

    const isServerWide = !args.channels && !args.roles && !args.users;

    let settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;

    let title = `Disabled ${Markup.codestring(commandId)}`;
    if (isServerWide) {
      title = `${title} server-wide`;
      await createGuildDisabledCommand(context, guildId, commandId, guildId, GuildDisableCommandsTypes.GUILD);
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
        const key = `${commandId}.${payload.item.id}.${payload.type}`;
        if (!settings.disabledCommands.has(key)) {
          await createGuildDisabledCommand(context, guildId, command.name, payload.item.id, payload.type);
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
        await createGuildDisabledCommand(context, guildId, command.name, payload.item.id, payload.type);
        settings = await GuildSettingsStore.fetch(context, guildId) as GuildSettings;
      } else {
        // do multiple
        settings = await GuildSettingsStore.getOrFetch(context, guildId) as GuildSettings;
        settings = await editGuildSettings(context, guildId, {
          disabledCommands: [
            ...payloads.map((payload) => ({command: command.name, id: payload.item.id, type: payload.type})),
            ...settings.disabledCommands.map((disabled) => ({command: disabled.command, id: disabled.id, type: disabled.type})),
          ],
        });
      }
      */
    }

    return createDisabledCommandsEmbed(context, settings.disabledCommands, {title})
  }
}
