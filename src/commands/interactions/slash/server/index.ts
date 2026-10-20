import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { ServerBansCommand } from './bans';
import { ServerCommandUsageCommand } from './command-usage';
import { ServerInvitesCommand } from './invites';
import { ServerLoggersGroupCommand } from './loggers';
import { ServerPrefixesGroupCommand } from './prefixes';
import { ServerRulesGroupCommand } from './rules';
import { ServerSetGroupCommand } from './set';


export default class ServerGroupCommand extends BaseSlashCommand {
  description = 'Set up NotSoBot for this server';
  descriptionLocalizations = I18n.localizations('commands.server.description');
  name = 'server';
  nameLocalizations = I18n.localizations('commands.server.name');

  contexts = [
    InteractionContextTypes.GUILD,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new ServerBansCommand(),
        new ServerCommandUsageCommand(),
        new ServerInvitesCommand(),
        new ServerLoggersGroupCommand(),
        new ServerPrefixesGroupCommand(),
        new ServerRulesGroupCommand(),
        new ServerSetGroupCommand(),
      ],
    });
  }
}
