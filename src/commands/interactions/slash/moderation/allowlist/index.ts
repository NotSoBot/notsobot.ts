import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ModerationAllowlistAddCommand } from './add';
import { ModerationAllowlistClearCommand } from './clear';
import { ModerationAllowlistListCommand } from './list';
import { ModerationAllowlistRemoveCommand } from './remove';


export class ModerationAllowlistGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'allowlist';

  constructor() {
    super({
      options: [
        new ModerationAllowlistAddCommand(),
        new ModerationAllowlistClearCommand(),
        new ModerationAllowlistListCommand(),
        new ModerationAllowlistRemoveCommand(),
      ],
    });
  }
}
