import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVOverlayFlagEuropeEastGroupCommand } from './europe-east';
import { MediaIVOverlayFlagEuropeSouthGroupCommand } from './europe-south';
import { MediaIVOverlayFlagEuropeWestGroupCommand } from './europe-west';
import { MediaIVOverlayFlagLatamGroupCommand } from './latam';


export default class MediaIVOverlayFlagGroupCommand extends BaseSlashCommand {
  description = 'Put country flags over an image or video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_overlay_flag.description');
  name = 'media-iv-overlay-flag';

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
        new MediaIVOverlayFlagEuropeEastGroupCommand(),
        new MediaIVOverlayFlagEuropeSouthGroupCommand(),
        new MediaIVOverlayFlagEuropeWestGroupCommand(),
        new MediaIVOverlayFlagLatamGroupCommand(),
      ],
    });
  }
}
