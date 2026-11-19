import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { ServerAutowarnAutomodCommand } from './automod';
import { ServerAutowarnBlockedCommand } from './blocked';
import { ServerAutowarnDecoyCommand } from './decoy';
import { ServerAutowarnExemptCommand } from './exempt';
import { ServerAutowarnListCommand } from './list';
import { ServerAutowarnMentionsCommand } from './mentions';
import { ServerAutowarnRemoveCommand } from './remove';


// was `/server autowarn` until /server hit discord's 8000 character limit, the ids stay `server.autowarn.*`
export default class ServerAutowarnGroupCommand extends BaseSlashCommand {
  description = 'Warn members automatically for mentions, blocked commands, AutoMod or the decoy channel';
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
        new ServerAutowarnDecoyCommand(),
        new ServerAutowarnExemptCommand(),
        new ServerAutowarnListCommand(),
        new ServerAutowarnMentionsCommand(),
        new ServerAutowarnRemoveCommand(),
      ],
    });
  }
}
