import { Command, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import GuildSettingsStore from '../../stores/guildsettings';
import { Parameters } from '../../utils';

import { BaseCommand } from '../basecommand';


export const MAX_LOGGERS = 10;

export interface CommandArgsBefore {
  channel: Structures.Channel | null | undefined,
  in: Structures.Channel | null | undefined,
}

export interface CommandArgs {
  channel: Structures.Channel | undefined,
  in: Structures.Channel | undefined,
}

export class LoggersAddBaseCommand extends BaseCommand {
  args = [
    {
      name: 'channel',
      type: Parameters.channel({
        types: [
          ChannelTypes.GUILD_NEWS,
          ChannelTypes.GUILD_TEXT,
        ],
      }),
    },
    {
      name: 'in',
      type: Parameters.channel({types: [ChannelTypes.GUILD_CATEGORY]}),
    },
  ];
  disableDm = true;
  permissionsClient = [Permissions.MANAGE_CHANNELS, Permissions.MANAGE_WEBHOOKS];
  permissions = [Permissions.MANAGE_GUILD];

  async onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.channel !== undefined && args.in !== undefined) {
      return false;
    }
    if (args.channel === null || args.in === null) {
      return false;
    }

    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId as string);
    return !!settings && settings.loggers.length < MAX_LOGGERS;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.channel !== undefined && args.in !== undefined) {
      return context.editOrReply('⚠ Cannot specify both `channel` and `in`.');
    }
    if (args.channel === null) {
      return context.editOrReply('⚠ Unable to find any valid Text Channels.');
    } else if (args.in === null) {
      return context.editOrReply('⚠ Unable to find any valid Category Channels.')
    }

    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId as string);
    if (settings && MAX_LOGGERS <= settings.loggers.length) {
      return context.editOrReply(`⚠ Reached the max amount of loggers. (${MAX_LOGGERS})`)
    }
    return context.editOrReply('⚠ Unknown lol');
  }
}
