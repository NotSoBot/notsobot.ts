import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { CommandsBlocklistAddCommand } from './add';
import { CommandsBlocklistAdminBypassCommand } from './admin-bypass';
import { CommandsBlocklistClearCommand } from './clear';
import { CommandsBlocklistListCommand } from './list';
import { CommandsBlocklistRemoveCommand } from './remove';


export class CommandsBlocklistGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Manage the command blocklist';
  descriptionLocalizations = I18n.localizations('commands.commands.blocklist.description');
  name = 'blocklist';
  nameLocalizations = I18n.localizations('commands.commands.blocklist.name');

  constructor() {
    super({
      options: [
        new CommandsBlocklistAddCommand(),
        new CommandsBlocklistAdminBypassCommand(),
        new CommandsBlocklistClearCommand(),
        new CommandsBlocklistListCommand(),
        new CommandsBlocklistRemoveCommand(),
      ],
    });
  }
}
