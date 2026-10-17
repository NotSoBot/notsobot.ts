import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ServerPrefixesAddCommand } from './add';
import { ServerPrefixesClearCommand } from './clear';
import { ServerPrefixesListCommand } from './list';
import { ServerPrefixesRemoveCommand } from './remove';
import { ServerPrefixesReplaceCommand } from './replace';


export class ServerPrefixesGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Prefixes';
  descriptionLocalizations = I18n.localizations('commands.prefixes.description');
  name = 'prefixes';
  nameLocalizations = I18n.localizations('commands.prefixes.name');

  constructor() {
    super({
      options: [
        new ServerPrefixesAddCommand(),
        new ServerPrefixesClearCommand(),
        new ServerPrefixesListCommand(),
        new ServerPrefixesRemoveCommand(),
        new ServerPrefixesReplaceCommand(),
      ],
    });
  }
}
