import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildLoggerTypes, StatusEmojis } from '../../../../../constants';
import GuildSettingsStore from '../../../../../stores/guildsettings';
import { I18n, displayReply } from '../../../../../utils';

import { createLoggersEmbed } from '../../../../prefixed/moderation/loggers';

import { BaseInteractionCommandOption } from '../../../basecommand';

import { LOGGER_TYPE_CHOICES } from './constants';


export interface CommandArgs {
  only?: GuildLoggerTypes,
}

export const COMMAND_NAME = 'list';

export class ServerLoggersListCommand extends BaseInteractionCommandOption {
  description = 'List all loggers inside of the server';
  descriptionLocalizations = I18n.localizations('commands.moderation.loggers.list.description');
  metadata = {
    id: 'server.loggers.list',
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.loggers.list.name');

  constructor() {
    super({
      permissions: [Permissions.MANAGE_GUILD],
      options: [
        {name: 'only', description: 'Only show loggers of this type', ...I18n.optionLocalizations('commands.moderation.loggers.list.only'), choices: LOGGER_TYPE_CHOICES, type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const settings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
    if (!settings) {
      const { translate } = await I18n.getTranslator(context);
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.unknown_lol')}`, ephemeral: true});
    }
    return createLoggersEmbed(context, settings.loggers, {only: (args.only === undefined) ? null : args.only});
  }
}
