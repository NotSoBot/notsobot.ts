import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ServerBlocklistAddCommand } from './add';
import { ServerBlocklistAdminBypassCommand } from './admin-bypass';
import { ServerBlocklistClearCommand } from './clear';
import { ServerBlocklistListCommand } from './list';
import { ServerBlocklistRemoveCommand } from './remove';


export class ServerBlocklistGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'blocklist';
  nameLocalizations = I18n.localizations('commands.moderation.blocklist.name');

  constructor() {
    super({
      options: [
        new ServerBlocklistAddCommand(),
        new ServerBlocklistAdminBypassCommand(),
        new ServerBlocklistClearCommand(),
        new ServerBlocklistListCommand(),
        new ServerBlocklistRemoveCommand(),
      ],
    });
  }
}
