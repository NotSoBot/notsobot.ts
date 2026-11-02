import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { FontsAddCommand } from './add';
import { FontsListCommand } from './list';
import { FontsRemoveCommand } from './remove';
import { FontsRenameCommand } from './rename';


// your saved fonts for caption, meme, recaption, the Default Font settings and MediaScript's `loadfont`, the server's
// are `/server fonts`. Adding one needs premium, keeping, renaming and removing them don't
export default class FontsCommand extends BaseSlashCommand {
  description = 'Your saved fonts';
  name = 'fonts';

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new FontsAddCommand(),
        new FontsListCommand(),
        new FontsRemoveCommand(),
        new FontsRenameCommand(),
      ],
    });
  }
}
