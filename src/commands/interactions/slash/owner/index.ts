import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { OwnerEvalCommand } from './eval';


export default class OwnerGroupCommand extends BaseSlashCommand {
  description = 'Owner Only Commands';
  descriptionLocalizations = I18n.localizations('commands.owner.description');
  name = 'owner';
  nameLocalizations = I18n.localizations('commands.owner.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new OwnerEvalCommand(),
      ],
    });
  }
}
