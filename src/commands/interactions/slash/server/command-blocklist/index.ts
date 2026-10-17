import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ServerCommandBlocklistAddCommand } from './add';
import { ServerCommandBlocklistAdminBypassCommand } from './admin-bypass';
import { ServerCommandBlocklistClearCommand } from './clear';
import { ServerCommandBlocklistListCommand } from './list';
import { ServerCommandBlocklistRemoveCommand } from './remove';


export class ServerCommandBlocklistGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Manage the command blocklist';
  descriptionLocalizations = I18n.localizations('commands.commands.blocklist.description');
  name = 'command-blocklist';
  nameLocalizations = I18n.localizations('commands.commands.blocklist.name');

  constructor() {
    super({
      options: [
        new ServerCommandBlocklistAddCommand(),
        new ServerCommandBlocklistAdminBypassCommand(),
        new ServerCommandBlocklistClearCommand(),
        new ServerCommandBlocklistListCommand(),
        new ServerCommandBlocklistRemoveCommand(),
      ],
    });
  }
}
