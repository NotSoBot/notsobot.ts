import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ServerCommandAllowlistAddCommand } from './add';
import { ServerCommandAllowlistAdminBypassCommand } from './admin-bypass';
import { ServerCommandAllowlistClearCommand } from './clear';
import { ServerCommandAllowlistListCommand } from './list';
import { ServerCommandAllowlistRemoveCommand } from './remove';


export class ServerCommandAllowlistGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Manage the command allowlist';
  descriptionLocalizations = I18n.localizations('commands.commands.allowlist.description');
  name = 'command-allowlist';
  nameLocalizations = I18n.localizations('commands.commands.allowlist.name');

  constructor() {
    super({
      options: [
        new ServerCommandAllowlistAddCommand(),
        new ServerCommandAllowlistAdminBypassCommand(),
        new ServerCommandAllowlistClearCommand(),
        new ServerCommandAllowlistListCommand(),
        new ServerCommandAllowlistRemoveCommand(),
      ],
    });
  }
}
