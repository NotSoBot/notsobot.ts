import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { ServerAllowlistGroupCommand } from './allowlist';
import { ServerBlocklistGroupCommand } from './blocklist';
import { ServerCommandAllowlistGroupCommand } from './command-allowlist';
import { ServerCommandBlocklistGroupCommand } from './command-blocklist';
import { ServerCommandUsageCommand } from './command-usage';
import { ServerLoggersGroupCommand } from './loggers';
import { ServerPrefixesGroupCommand } from './prefixes';
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
        new ServerAllowlistGroupCommand(),
        new ServerBlocklistGroupCommand(),
        new ServerCommandAllowlistGroupCommand(),
        new ServerCommandBlocklistGroupCommand(),
        new ServerCommandUsageCommand(),
        new ServerLoggersGroupCommand(),
        new ServerPrefixesGroupCommand(),
        new ServerSetGroupCommand(),
      ],
    });
  }
}
