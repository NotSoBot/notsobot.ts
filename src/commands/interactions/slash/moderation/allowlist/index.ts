import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ModerationAllowlistAddCommand } from './add';
import { ModerationAllowlistAdminBypassCommand } from './admin-bypass';
import { ModerationAllowlistClearCommand } from './clear';
import { ModerationAllowlistListCommand } from './list';
import { ModerationAllowlistRemoveCommand } from './remove';


export class ModerationAllowlistGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'allowlist';
  nameLocalizations = I18n.localizations('commands.moderation.allowlist.name');

  constructor() {
    super({
      options: [
        new ModerationAllowlistAddCommand(),
        new ModerationAllowlistAdminBypassCommand(),
        new ModerationAllowlistClearCommand(),
        new ModerationAllowlistListCommand(),
        new ModerationAllowlistRemoveCommand(),
      ],
    });
  }
}
