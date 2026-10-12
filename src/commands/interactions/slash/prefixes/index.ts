import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { PrefixesAddCommand } from './prefixes.add';
import { PrefixesClearCommand } from './prefixes.clear';
import { PrefixesListCommand } from './prefixes.list';
import { PrefixesRemoveCommand } from './prefixes.remove';
import { PrefixesReplaceCommand } from './prefixes.replace';


export default class PrefixesGroupCommand extends BaseSlashCommand {
  description = 'Prefixes';
  descriptionLocalizations = I18n.localizations('commands.prefixes.description');
  disableDm = true;
  name = 'prefixes';
  nameLocalizations = I18n.localizations('commands.prefixes.name');

  contexts = [
    InteractionContextTypes.GUILD,
  ];

  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new PrefixesAddCommand(),
        new PrefixesClearCommand(),
        new PrefixesListCommand(),
        new PrefixesRemoveCommand(),
        new PrefixesReplaceCommand(),
      ],
    });
  }
}
