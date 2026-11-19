import { Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildWarningAutoTriggers } from '../../../../constants';
import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { exemptOptions, warningsOption } from './shared';


export interface CommandArgs {
  'exempt-permissions'?: bigint,
  'exempt-roles'?: Array<Structures.Role>,
  warnings?: number,
}

export class ServerAutowarnDecoyCommand extends BaseInteractionCommandOption {
  // NotSoBot's owners don't skip the member permissions here, it can wreck a server
  permissionsIgnoreClientOwner = false;

  description = 'Also warn members removed for posting in the decoy channel (/server-decoy)';
  descriptionLocalizations = I18n.localizations('commands.autowarn.decoy.description');
  metadata = {
    id: Formatter.Commands.ModerationAutowarn.COMMAND_ID_DECOY,
  };
  name = 'decoy';
  nameLocalizations = I18n.localizations('commands.autowarn.decoy.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        warningsOption('commands.autowarn.decoy'),
        ...exemptOptions('commands.autowarn.decoy'),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationAutowarn.createSetMessage(context, {
      channel: null,
      exemptPermissions: args['exempt-permissions'],
      exemptRoles: args['exempt-roles'],
      trigger: GuildWarningAutoTriggers.DECOY,
      warnings: args.warnings,
    });
  }
}
