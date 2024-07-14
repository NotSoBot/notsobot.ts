import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { OwnerEvalCommand } from './eval';


export default class OwnerGroupCommand extends BaseSlashCommand {
  description = 'Owner Only Commands';
  name = 'owner';

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
