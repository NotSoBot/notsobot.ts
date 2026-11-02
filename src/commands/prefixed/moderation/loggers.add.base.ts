import { Command, CommandClient } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { GuildLoggerTypes, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


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

  async onBeforeRun(context: Command.Context, args: Formatter.Commands.ServerLoggersAdd.CommandArgsBefore) {
    if (args.channel === null || args.in === null) {
      return false;
    }
    const warning = await Formatter.Commands.ServerLoggersAdd.getLoggerAddWarning(context, {channel: args.channel, in: args.in, type: this.loggerType});
    return !warning;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ServerLoggersAdd.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.channel !== undefined && args.in !== undefined) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.logger_channel_and_in')}`});
    }
    if (args.channel === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_valid_channels')}`});
    } else if (args.in === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_valid_categories')}`});
    }

    const warning = await Formatter.Commands.ServerLoggersAdd.getLoggerAddWarning(context, {channel: args.channel, in: args.in, type: this.loggerType});
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${warning || translate('errors.unknown_lol')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.ServerLoggersAdd.CommandArgs) {
    return Formatter.Commands.ServerLoggersAdd.createLogger(context, {channel: args.channel, in: args.in, type: this.loggerType});
  }
}
