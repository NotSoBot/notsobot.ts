import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVPrideGroupCommand } from './pride';
import { MediaIVOverlayMiscGroupCommand } from './misc';


export default class MediaIVOverlayGroupCommand extends BaseSlashCommand {
  description = 'Put flags, guns, watermarks and more over an image or video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_overlay.description');
  name = 'media-iv-overlay';

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
        new MediaIVPrideGroupCommand(),
        new MediaIVOverlayMiscGroupCommand(),
      ],
    });
  }
}
