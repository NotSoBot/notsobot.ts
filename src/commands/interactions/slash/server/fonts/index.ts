import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ServerFontsAddCommand } from './add';
import { ServerFontsListCommand } from './list';
import { ServerFontsRemoveCommand } from './remove';
import { ServerFontsRenameCommand } from './rename';


// the server's saved fonts, every member can use them by name. Adding one needs a premium server slot, changing them
// needs Manage Server
export class ServerFontsGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'The server\'s saved fonts';
  name = 'fonts';

  constructor() {
    super({
      options: [
        new ServerFontsAddCommand(),
        new ServerFontsListCommand(),
        new ServerFontsRemoveCommand(),
        new ServerFontsRenameCommand(),
      ],
    });
  }
}
