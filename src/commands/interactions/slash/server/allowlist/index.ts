import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ServerAllowlistAddCommand } from './add';
import { ServerAllowlistAdminBypassCommand } from './admin-bypass';
import { ServerAllowlistClearCommand } from './clear';
import { ServerAllowlistListCommand } from './list';
import { ServerAllowlistRemoveCommand } from './remove';


export class ServerAllowlistGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'allowlist';
  nameLocalizations = I18n.localizations('commands.moderation.allowlist.name');

  constructor() {
    super({
      options: [
        new ServerAllowlistAddCommand(),
        new ServerAllowlistAdminBypassCommand(),
        new ServerAllowlistClearCommand(),
        new ServerAllowlistListCommand(),
        new ServerAllowlistRemoveCommand(),
      ],
    });
  }
}
