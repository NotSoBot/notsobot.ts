import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, Permissions } from 'detritus-client/lib/constants';

import { GuildWarningAutoTriggers, MAX_GUILD_WARNINGS_AUTO_MENTIONS } from '../../../../../constants';
import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';

import { channelOption, exemptOptions, warningsOption } from './shared';


export interface CommandArgs {
  channel?: Structures.Channel | null,
  'exempt-permissions'?: bigint,
  'exempt-roles'?: Array<Structures.Role>,
  limit: number,
  warnings?: number,
}

export class ServerAutowarnMentionsCommand extends BaseInteractionCommandOption {
  description = 'Warn members that mention more than a number of users and roles in one message';
  descriptionLocalizations = I18n.localizations('commands.autowarn.mentions.description');
  metadata = {
    id: Formatter.Commands.ModerationAutowarn.COMMAND_ID_MENTIONS,
  };
  name = 'mentions';
  nameLocalizations = I18n.localizations('commands.autowarn.mentions.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'limit',
          description: 'The most users and roles one message can mention',
          ...I18n.optionLocalizations('commands.autowarn.mentions.limit'),
          maxValue: MAX_GUILD_WARNINGS_AUTO_MENTIONS,
          minValue: 1,
          required: true,
          type: ApplicationCommandOptionTypes.INTEGER,
        },
        warningsOption('commands.autowarn.mentions'),
        channelOption('commands.autowarn.mentions'),
        ...exemptOptions('commands.autowarn.mentions'),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationAutowarn.createSetMessage(context, {
      channel: args.channel || null,
      exemptPermissions: args['exempt-permissions'],
      exemptRoles: args['exempt-roles'],
      limit: args.limit,
      trigger: GuildWarningAutoTriggers.MENTIONS,
      warnings: args.warnings,
    });
  }
}
