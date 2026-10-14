import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVCaptionCommand } from './caption';
import { MediaIVMemeCommand } from './meme';
import { MediaIVRecaptionCommand } from './recaption';
import { MediaIVVaporwaveCommand } from './vaporwave';
import { MediaIVWatchMojoCommand } from './watchmojo';


export default class MediaIVTextGroupCommand extends BaseSlashCommand {
  description = 'Image and Video Text Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.description');
  name = 'media-iv-text';

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
        new MediaIVCaptionCommand(),
        new MediaIVMemeCommand(),
        new MediaIVRecaptionCommand(),
        new MediaIVVaporwaveCommand(),
        new MediaIVWatchMojoCommand(),
      ],
    });
  }
}
