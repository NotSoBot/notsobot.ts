import { Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildWarningAutoTriggers } from '../../../../../constants';
import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';

import { channelOption, warningsOption } from './shared';


export interface CommandArgs {
  channel?: Structures.Channel | null,
  warnings?: number,
}

export class ServerAutowarnBlockedCommand extends BaseInteractionCommandOption {
  description = 'Warn members that use a command the server\'s rules block for them';
  descriptionLocalizations = I18n.localizations('commands.autowarn.blocked.description');
  metadata = {
    id: Formatter.Commands.ModerationAutowarn.COMMAND_ID_BLOCKED,
  };
  name = 'blocked';
  nameLocalizations = I18n.localizations('commands.autowarn.blocked.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        warningsOption('commands.autowarn.blocked'),
        channelOption('commands.autowarn.blocked'),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationAutowarn.createSetMessage(context, {
      channel: args.channel || null,
      trigger: GuildWarningAutoTriggers.BLOCKED_COMMAND,
      warnings: args.warnings,
    });
  }
}
