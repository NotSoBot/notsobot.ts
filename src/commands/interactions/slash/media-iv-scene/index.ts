import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVBillCommand } from './bill';
import { MediaIVBurnCommand } from './burn';
import { MediaIVGlassCommand } from './glass';
import { MediaIVInstantCameraCommand } from './instant-camera';
import { MediaIVLatteCommand } from './latte';
import { MediaIVMuseumCommand } from './museum';
import { MediaIVOldTVCommand } from './old-tv';
import { MediaIVPaperCommand } from './paper';
import { MediaIVSpheresCommand } from './spheres';
import { MediaIVTimesquareCommand } from './times-square';
import { MediaIVUniverseCommand } from './universe';


export default class MediaIVSceneGroupCommand extends BaseSlashCommand {
  description = 'Place an image or video in a scene: museum, billboard, old TV and more';
  descriptionLocalizations = I18n.localizations('commands.media_iv_scene.description');
  name = 'media-iv-scene';

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
        new MediaIVBillCommand(),
        new MediaIVBurnCommand(),
        new MediaIVGlassCommand(),
        new MediaIVInstantCameraCommand(),
        new MediaIVLatteCommand(),
        new MediaIVMuseumCommand(),
        new MediaIVOldTVCommand(),
        new MediaIVPaperCommand(),
        new MediaIVSpheresCommand(),
        new MediaIVTimesquareCommand(),
        new MediaIVUniverseCommand(),
      ],
    });
  }
}
