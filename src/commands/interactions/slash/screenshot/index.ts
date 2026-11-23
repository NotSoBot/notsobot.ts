import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { ScreenshotPostCommand } from './post';
import { ScreenshotWebsiteCommand } from './website';



// pictures of real things, as they are: a website, or a post drawn from its link. apart from the `/fake` groups, whose
// posts are made up
export default class ScreenshotGroupCommand extends BaseSlashCommand {
  description = 'Screenshots of real things: a website, or a post drawn from its link';
  descriptionLocalizations = I18n.localizations('commands.screenshot.description');
  name = 'screenshot';
  nameLocalizations = I18n.localizations('commands.screenshot.name');

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
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new ScreenshotPostCommand(),
        new ScreenshotWebsiteCommand(),
      ],
    });
  }
}
