import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ModerationBlocklistAddCommand } from './add';
import { ModerationBlocklistAdminBypassCommand } from './admin-bypass';
import { ModerationBlocklistClearCommand } from './clear';
import { ModerationBlocklistListCommand } from './list';
import { ModerationBlocklistRemoveCommand } from './remove';


export class ModerationBlocklistGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'blocklist';
  nameLocalizations = I18n.localizations('commands.moderation.blocklist.name');

  constructor() {
    super({
      options: [
        new ModerationBlocklistAddCommand(),
        new ModerationBlocklistAdminBypassCommand(),
        new ModerationBlocklistClearCommand(),
        new ModerationBlocklistListCommand(),
        new ModerationBlocklistRemoveCommand(),
      ],
    });
  }
}
