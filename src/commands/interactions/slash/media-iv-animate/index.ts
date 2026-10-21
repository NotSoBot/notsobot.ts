import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVFlashCommand } from './flash';
import { MediaIVInOutCommand } from './in-out';
import { MediaIVOrbCommand } from './orb';
import { MediaIVOutInCommand } from './out-in';
import { MediaIVRainbowCommand } from './rainbow';
import { MediaIVShakeCommand } from './shake';
import { MediaIVSideToSideCommand } from './side-to-side';
import { MediaIVSlideCommand } from './slide';
import { MediaIVSpin3dCommand } from './spin-3d';
import { MediaIVSpinCommand } from './spin';
import { MediaIVUpToDownCommand } from './up-to-down';


export default class MediaIVAnimateGroupCommand extends BaseSlashCommand {
  description = 'Animate an image or video: spin, shake, flash and more';
  descriptionLocalizations = I18n.localizations('commands.media_iv_animate.description');
  name = 'media-iv-animate';

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
        new MediaIVFlashCommand(),
        new MediaIVInOutCommand(),
        new MediaIVOutInCommand(),
        new MediaIVRainbowCommand(),
        new MediaIVSideToSideCommand(),
        new MediaIVUpToDownCommand(),
        new MediaIVOrbCommand(),
        new MediaIVShakeCommand(),
        new MediaIVSlideCommand(),
        new MediaIVSpinCommand(),
        new MediaIVSpin3dCommand(),
      ],
    });
  }
}
