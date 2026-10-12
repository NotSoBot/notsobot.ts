import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, ChannelTypes, MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { GuildLoggerTypes, StatusEmojis } from '../../../../../constants';
import { I18n, editOrReply } from '../../../../../utils';

import { createLogger, getLoggerAddWarning } from '../../../../prefixed/moderation/loggers.add.base';
import { BaseInteractionCommandOption } from '../../../basecommand';

import { LOGGER_TYPE_CHOICES } from './constants';


export interface CommandArgs {
  channel?: Structures.Channel,
  in?: Structures.Channel,
  type: GuildLoggerTypes,
}

export const COMMAND_NAME = 'add';

export class ModerationLoggersAddCommand extends BaseInteractionCommandOption {
  description = 'Create a logger for server events';
  descriptionLocalizations = I18n.localizations('commands.moderation.loggers.add.description');
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.loggers.add.name');

  constructor() {
    super({
      permissions: [Permissions.MANAGE_GUILD],
      options: [
        {name: 'type', description: 'Type of events to log', ...I18n.optionLocalizations('commands.moderation.loggers.add.type'), choices: LOGGER_TYPE_CHOICES, required: true, type: Number},
        {
          name: 'channel',
          description: 'Channel to log into (Default: Creates a new channel)',
          ...I18n.optionLocalizations('commands.moderation.loggers.add.channel'),
          channelTypes: [ChannelTypes.GUILD_NEWS, ChannelTypes.GUILD_TEXT],
          type: ApplicationCommandOptionTypes.CHANNEL,
        },
        {
          name: 'in',
          description: 'Category to create the new log channel in',
          ...I18n.optionLocalizations('commands.moderation.loggers.add.in'),
          channelTypes: [ChannelTypes.GUILD_CATEGORY],
          type: ApplicationCommandOptionTypes.CHANNEL,
        },
      ],
    });
  }

  async onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !(await getLoggerAddWarning(context, args));
  }

  async onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    const warning = await getLoggerAddWarning(context, args);
    return editOrReply(context, {content: `${StatusEmojis.WARNING} ${warning || translate('errors.unknown_lol')}`, flags: MessageFlags.EPHEMERAL});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return createLogger(context, args);
  }
}
