import { BaseSlashCommand } from '../../basecommand';

import { PrefixesAddCommand } from './prefixes.add';
import { PrefixesClearCommand } from './prefixes.clear';
import { PrefixesListCommand } from './prefixes.list';
import { PrefixesRemoveCommand } from './prefixes.remove';
import { PrefixesReplaceCommand } from './prefixes.replace';


export default class PrefixesGroupCommand extends BaseSlashCommand {
  description = 'Prefixes';
  disableDm = true;
  name = 'prefixes';

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
