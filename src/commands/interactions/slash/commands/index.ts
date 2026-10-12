import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { CommandsAllowlistGroupCommand } from './allowlist';
import { CommandsBlocklistGroupCommand } from './blocklist';
import { CommandsUsageCommand } from './usage';


export default class CommandsGroupCommand extends BaseSlashCommand {
  description = 'Server Command Settings';
  descriptionLocalizations = I18n.localizations('commands.commands.description');
  name = 'commands';
  nameLocalizations = I18n.localizations('commands.commands.name');

  contexts = [
    InteractionContextTypes.GUILD,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new CommandsAllowlistGroupCommand(),
        new CommandsBlocklistGroupCommand(),
        new CommandsUsageCommand(),
      ],
    });
  }
}
