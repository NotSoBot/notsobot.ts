import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { ServerDecoyCreateCommand } from './create';
import { ServerDecoyNoticeCommand } from './notice';
import { ServerDecoyRemoveCommand } from './remove';
import { ServerDecoyRenameCommand } from './rename';
import { ServerDecoySettingsCommand } from './settings';
import { ServerDecoyStatusCommand } from './status';


// its own group, /server is close to discord's 8000 character limit
export default class ServerDecoyGroupCommand extends BaseSlashCommand {
  description = 'A channel that removes anyone who posts in it, to catch spam accounts';
  descriptionLocalizations = I18n.localizations('commands.decoy.description');
  name = 'server-decoy';

  contexts = [
    InteractionContextTypes.GUILD,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new ServerDecoyCreateCommand(),
        new ServerDecoyNoticeCommand(),
        new ServerDecoyRemoveCommand(),
        new ServerDecoyRenameCommand(),
        new ServerDecoySettingsCommand(),
        new ServerDecoyStatusCommand(),
      ],
    });
  }
}
