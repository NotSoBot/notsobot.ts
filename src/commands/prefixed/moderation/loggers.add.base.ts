import { Command, CommandClient, Interaction, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { createGuildLogger } from '../../../api';
import { GuildLoggerTypes, StatusEmojis } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { createLoggersEmbed, getLoggerTypeText } from './loggers';


export const MAX_LOGGERS = 10;

export const LOGGER_CHANNEL_NAMES: Record<GuildLoggerTypes, string> = {
  [GuildLoggerTypes.BANS]: 'ban-logs',
  [GuildLoggerTypes.CHANNELS]: 'channel-logs',
  [GuildLoggerTypes.MEMBERS]: 'member-logs',
  [GuildLoggerTypes.MESSAGES]: 'message-logs',
  [GuildLoggerTypes.MODERATION]: 'mod-logs',
  [GuildLoggerTypes.ROLES]: 'role-logs',
  [GuildLoggerTypes.USERS]: 'user-logs',
  [GuildLoggerTypes.VOICE]: 'voice-logs',
};

export interface LoggerAddOptions {
  channel?: Structures.Channel,
  in?: Structures.Channel,
  type: GuildLoggerTypes,
}

// Returns a translated warning if the logger can't be created, shared by the prefixed and slash commands
export async function getLoggerAddWarning(
  context: Command.Context | Interaction.InteractionContext,
  options: LoggerAddOptions,
): Promise<string | null> {
  const { label, translate } = await I18n.getTranslator(context);
  if (options.channel && options.in) {
    return translate('moderation.logger_channel_and_in');
  }

  const guild = context.guild as Structures.Guild;
  if (options.channel) {
    // slash command resolved channels don't include overwrites, so prefer the cached one
    const channel = context.channels.get(options.channel.id) || options.channel;
    if (!channel.canManageWebhooks) {
      return translate('moderation.logger_needs_manage_webhooks', {
        channel: `${channel}`,
        permission: Markup.codestring(label('permissions', 'Manage Webhooks')),
      });
    }
  } else {
    // we will be making a channel now, so we need the permissions in the category or the guild itself
    let canManageChannels: boolean;
    let canManageWebhooks: boolean;
    let where: string;
    if (options.in) {
      const category = context.channels.get(options.in.id) || options.in;
      canManageChannels = category.canEdit;
      // `canManageWebhooks` is always false on categories (it requires a text channel), the new channel inherits these overwrites
      canManageWebhooks = category.can([Permissions.VIEW_CHANNEL, Permissions.MANAGE_WEBHOOKS]);
      where = `${category}`;
    } else {
      canManageChannels = !!(guild.me && guild.me.canManageChannels);
      canManageWebhooks = !!(guild.me && guild.me.canManageWebhooks);
      where = Markup.bold(Markup.escape.all(guild.name));
    }
    if (!canManageChannels) {
      return translate('moderation.logger_needs_manage_channels', {permission: Markup.codestring(label('permissions', 'Manage Channels'))});
    }
    if (!canManageWebhooks) {
      return translate('moderation.logger_needs_manage_webhooks', {
        channel: where,
        permission: Markup.codestring(label('permissions', 'Manage Webhooks')),
      });
    }
  }

  const settings = await GuildSettingsStore.getOrFetch(context, guild.id);
  if (!settings) {
    return translate('errors.unknown_lol');
  }
  if (MAX_LOGGERS <= settings.loggers.length) {
    return translate('moderation.logger_max', {max: MAX_LOGGERS});
  }
  if (options.channel) {
    const channelId = options.channel.id;
    if (settings.loggers.some((logger) => logger.type === options.type && logger.channelId === channelId)) {
      return translate('api_errors.guild_logger_type_conflict');
    }
  }
  return null;
}

export async function createLogger(
  context: Command.Context | Interaction.InteractionContext,
  options: LoggerAddOptions,
) {
  const guild = context.guild as Structures.Guild;
  const { translate } = await I18n.getTranslator(context);

  let channel: Structures.Channel;
  let createdChannel = false;
  if (options.channel) {
    channel = options.channel;
  } else {
    channel = await guild.createChannel({
      name: LOGGER_CHANNEL_NAMES[options.type],
      parentId: (options.in) ? options.in.id : undefined,
      type: ChannelTypes.GUILD_TEXT,
    });
    createdChannel = true;
  }

  let webhook: Structures.Webhook | undefined;
  let loggers: Awaited<ReturnType<typeof createGuildLogger>>;
  try {
    webhook = await channel.createWebhook({name: 'NotSoLogs'});
    loggers = await createGuildLogger(context, guild.id, {
      channelId: channel.id,
      type: options.type,
      webhookId: webhook.id,
      webhookToken: webhook.token!,
    });
  } catch (error) {
    // don't leave a dead channel/webhook behind if the api rejected the logger
    if (createdChannel) {
      await channel.delete().catch(() => {});
    } else if (webhook) {
      await webhook.delete().catch(() => {});
    }
    throw error;
  }

  const title = translate('loggers.created', {
    channel: `${channel}`,
    id: channel.id,
    type: getLoggerTypeText(translate, options.type),
  });
  return createLoggersEmbed(context, loggers, {title});
}


export interface CommandArgsBefore {
  channel: Structures.Channel | null | undefined,
  in: Structures.Channel | null | undefined,
}

export interface CommandArgs {
  channel: Structures.Channel | undefined,
  in: Structures.Channel | undefined,
}

export class LoggersAddBaseCommand extends BaseCommand {
  loggerType: GuildLoggerTypes;

  constructor(client: CommandClient, loggerType: GuildLoggerTypes, options: Command.CommandOptions) {
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
      permissions: [Permissions.MANAGE_GUILD],
      ...options,
    });
    this.loggerType = loggerType;
  }

  async onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.channel === null || args.in === null) {
      return false;
    }
    const warning = await getLoggerAddWarning(context, {channel: args.channel, in: args.in, type: this.loggerType});
    return !warning;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.channel !== undefined && args.in !== undefined) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.logger_channel_and_in')}`});
    }
    if (args.channel === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_valid_channels')}`});
    } else if (args.in === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_valid_categories')}`});
    }

    const warning = await getLoggerAddWarning(context, {channel: args.channel, in: args.in, type: this.loggerType});
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${warning || translate('errors.unknown_lol')}`});
  }

  async run(context: Command.Context, args: CommandArgs) {
    return createLogger(context, {channel: args.channel, in: args.in, type: this.loggerType});
  }
}
