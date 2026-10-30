import { Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildWarningAutoTriggers } from '../../../../constants';
import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { automodRuleOption, channelOption, exemptOptions, warningsOption } from './shared';


export interface CommandArgs {
  channel?: Structures.Channel | null,
  'exempt-permissions'?: bigint,
  'exempt-roles'?: Array<Structures.Role>,
  rule?: Formatter.Commands.ModerationAutowarn.AutomodRuleChoice,
  warnings?: number,
}

export class ServerAutowarnAutomodCommand extends BaseInteractionCommandOption {
  description = 'Warn members that set off the server\'s discord AutoMod rules (I need Manage Server)';
  descriptionLocalizations = I18n.localizations('commands.autowarn.automod.description');
  metadata = {
    id: Formatter.Commands.ModerationAutowarn.COMMAND_ID_AUTOMOD,
  };
  name = 'automod';
  nameLocalizations = I18n.localizations('commands.autowarn.automod.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        automodRuleOption('commands.autowarn.automod'),
        warningsOption('commands.autowarn.automod'),
        channelOption('commands.autowarn.automod'),
        ...exemptOptions('commands.autowarn.automod'),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationAutowarn.createSetMessage(context, {
      automodRule: args.rule,
      channel: args.channel || null,
      exemptPermissions: args['exempt-permissions'],
      exemptRoles: args['exempt-roles'],
      trigger: GuildWarningAutoTriggers.AUTOMOD,
      warnings: args.warnings,
    });
  }
}
