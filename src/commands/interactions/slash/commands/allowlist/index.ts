import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { CommandsAllowlistAddCommand } from './add';
import { CommandsAllowlistAdminBypassCommand } from './admin-bypass';
import { CommandsAllowlistClearCommand } from './clear';
import { CommandsAllowlistListCommand } from './list';
import { CommandsAllowlistRemoveCommand } from './remove';


export class CommandsAllowlistGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Manage the command allowlist';
  descriptionLocalizations = I18n.localizations('commands.commands.allowlist.description');
  name = 'allowlist';
  nameLocalizations = I18n.localizations('commands.commands.allowlist.name');

  constructor() {
    super({
      options: [
        new CommandsAllowlistAddCommand(),
        new CommandsAllowlistAdminBypassCommand(),
        new CommandsAllowlistClearCommand(),
        new CommandsAllowlistListCommand(),
        new CommandsAllowlistRemoveCommand(),
      ],
    });
  }
}
