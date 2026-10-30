import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { ServerAutowarnAutomodCommand } from './automod';
import { ServerAutowarnBlockedCommand } from './blocked';
import { ServerAutowarnExemptCommand } from './exempt';
import { ServerAutowarnListCommand } from './list';
import { ServerAutowarnMentionsCommand } from './mentions';
import { ServerAutowarnRemoveCommand } from './remove';


// was `/server autowarn` until /server hit discord's 8000 character limit, the ids stay `server.autowarn.*`
export default class ServerAutowarnGroupCommand extends BaseSlashCommand {
  description = 'Warn members automatically for too many mentions, blocked commands or AutoMod';
  descriptionLocalizations = I18n.localizations('commands.autowarn.description');
  name = 'server-autowarn';

  contexts = [
    InteractionContextTypes.GUILD,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new ServerAutowarnAutomodCommand(),
        new ServerAutowarnBlockedCommand(),
        new ServerAutowarnExemptCommand(),
        new ServerAutowarnListCommand(),
        new ServerAutowarnMentionsCommand(),
        new ServerAutowarnRemoveCommand(),
      ],
    });
  }
}
