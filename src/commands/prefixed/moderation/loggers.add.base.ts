import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { StatusEmojis } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { I18n, Parameters } from '../../../utils';

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
  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      args: [
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
      ],
      disableDm: true,
      permissionsClient: [Permissions.MANAGE_WEBHOOKS],
      permissions: [Permissions.MANAGE_GUILD],
      ...options,
    });
  }

  async onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.channel !== undefined && args.in !== undefined) {
      return false;
    }
    if (args.channel === null || args.in === null) {
      return false;
    }
    if (args.channel === undefined) {
      // we will be making a channel now
      const channel = args.in || context.channel;
      if (!channel || !channel.canEdit) {
        return false;
      }
    }

    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId as string);
    return !!settings && settings.loggers.length < MAX_LOGGERS;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { label, translate } = await I18n.getTranslator(context);
    if (args.channel !== undefined && args.in !== undefined) {
      return context.editOrReply(`${StatusEmojis.WARNING} ${translate('moderation.logger_channel_and_in')}`);
    }
    if (args.channel === null) {
      return context.editOrReply(`${StatusEmojis.WARNING} ${translate('moderation.no_valid_channels')}`);
    } else if (args.in === null) {
      return context.editOrReply(`${StatusEmojis.WARNING} ${translate('moderation.no_valid_categories')}`)
    }

    if (args.channel === undefined) {
      // we will be making a channel now
      const channel = args.in || context.channel;
      if (!channel || !channel.canEdit) {
        return context.editOrReply(`${StatusEmojis.WARNING} ${translate('moderation.logger_needs_manage_channels', {permission: Markup.codestring(label('permissions', 'Manage Channels'))})}`);
      }
    }

    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId as string);
    if (settings && MAX_LOGGERS <= settings.loggers.length) {
      return context.editOrReply(`${StatusEmojis.WARNING} ${translate('moderation.logger_max', {max: MAX_LOGGERS})}`)
    }
    return context.editOrReply(`${StatusEmojis.WARNING} ${translate('errors.unknown_lol')}`);
  }
}
