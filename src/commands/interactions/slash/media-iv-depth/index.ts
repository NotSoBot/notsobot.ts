import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVDepthMapCommand } from './map';
import { MediaIVDepthMiniatureCommand } from './miniature';
import { MediaIVDepthPhoto3dCommand } from './photo-3d';
import { MediaIVDepthPortraitCommand } from './portrait';
import { MediaIVDepthStereoCommand } from './stereo';


export default class MediaIVDepthGroupCommand extends BaseSlashCommand {
  description = 'Effects from an image or video\'s depth: portrait blur, 3D photos, stereo 3D and more';
  descriptionLocalizations = I18n.localizations('commands.media_iv_depth.description');
  name = 'media-iv-depth';

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
        new MediaIVDepthMapCommand(),
        new MediaIVDepthMiniatureCommand(),
        new MediaIVDepthPhoto3dCommand(),
        new MediaIVDepthPortraitCommand(),
        new MediaIVDepthStereoCommand(),
      ],
    });
  }
}
