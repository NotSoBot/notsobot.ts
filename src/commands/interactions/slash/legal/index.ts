import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { LegalPrivacyCommand } from './privacy';
import { LegalTermsCommand } from './terms';


export default class LegalGroupCommand extends BaseSlashCommand {
  description = 'Legal Information';
  descriptionLocalizations = I18n.localizations('commands.legal.description');
  name = 'legal';
  nameLocalizations = I18n.localizations('commands.legal.name');

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
        new LegalPrivacyCommand(),
        new LegalTermsCommand(),
      ],
    });
  }
}
