import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { GuildLoggerTypes } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  channel?: Structures.Channel,
  clear?: boolean,
  logger?: Structures.Channel,
  role?: Structures.Role,
  type: GuildLoggerTypes,
}

export const COMMAND_NAME = 'ignore';

export const LOGGER_IGNORE_TYPE_CHOICES = [
  Parameters.Slash.createChoice('Channels', GuildLoggerTypes.CHANNELS, {localizationKey: 'choices.guild_logger_types.channels'}),
  Parameters.Slash.createChoice('Messages', GuildLoggerTypes.MESSAGES, {localizationKey: 'choices.guild_logger_types.messages'}),
  Parameters.Slash.createChoice('Roles', GuildLoggerTypes.ROLES, {localizationKey: 'choices.guild_logger_types.roles'}),
  Parameters.Slash.createChoice('Voice', GuildLoggerTypes.VOICE, {localizationKey: 'choices.guild_logger_types.voice'}),
];

export class ServerLoggersIgnoreCommand extends BaseInteractionCommandOption {
  description = 'Make a logger skip events from channels or roles (run again to stop)';
  descriptionLocalizations = I18n.localizations('commands.moderation.loggers.ignore.description');
  metadata = {
    id: Formatter.Commands.ServerLoggersIgnore.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.loggers.ignore.name');

  constructor() {
    super({
      permissions: [Permissions.MANAGE_GUILD],
      options: [
        {name: 'type', description: 'Type of logger', ...I18n.optionLocalizations('commands.moderation.loggers.ignore.type'), choices: LOGGER_IGNORE_TYPE_CHOICES, required: true, type: Number},
        {
          name: 'channel',
          description: 'Channel or category to ignore, covers its threads/channels',
          ...I18n.optionLocalizations('commands.moderation.loggers.ignore.channel'),
          channelTypes: Formatter.Commands.ServerLoggersIgnore.IGNORE_CHANNEL_TYPES,
          type: ApplicationCommandOptionTypes.CHANNEL,
        },
        {name: 'role', description: 'Role to ignore (roles logger)', ...I18n.optionLocalizations('commands.moderation.loggers.ignore.role'), type: ApplicationCommandOptionTypes.ROLE},
        {
          name: 'logger',
          description: 'Only the logger in this channel (Default: all of the type)',
          ...I18n.optionLocalizations('commands.moderation.loggers.ignore.logger'),
          channelTypes: [ChannelTypes.GUILD_NEWS, ChannelTypes.GUILD_TEXT],
          type: ApplicationCommandOptionTypes.CHANNEL,
        },
        {name: 'clear', description: 'Stop ignoring everything', ...I18n.optionLocalizations('commands.moderation.loggers.ignore.clear'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ServerLoggersIgnore.createMessage(context, {
      channels: (args.channel) ? [args.channel] : [],
      clear: args.clear,
      logger: args.logger,
      roles: (args.role) ? [args.role] : [],
      type: args.type,
    });
  }
}
