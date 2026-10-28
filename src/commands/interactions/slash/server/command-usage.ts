import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes, ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'command-usage';

export class ServerCommandUsageCommand extends BaseInteractionCommandOption {
  description = 'Show the latest commands used in this server';
  descriptionLocalizations = I18n.localizations('commands.commands.usage.description');
  metadata = {
    id: Formatter.Commands.ModerationCommandsUsage.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.commands.usage.name');

  constructor() {
    super({
      permissions: [Permissions.MANAGE_GUILD],
      options: [
        {name: 'channel', description: 'Only show commands used in this channel', ...I18n.optionLocalizations('commands.commands.usage.channel'), channelTypes: [ChannelTypes.GUILD_TEXT], type: ApplicationCommandOptionTypes.CHANNEL},
        {name: 'user', description: 'Only show commands used by this user', ...I18n.optionLocalizations('commands.commands.usage.user'), type: ApplicationCommandOptionTypes.USER},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationCommandsUsage.CommandArgs) {
    return Formatter.Commands.ModerationCommandsUsage.createMessage(context, args);
  }
}
