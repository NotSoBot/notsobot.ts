import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVDatamoshCommand } from './datamosh';
import { MediaIVDeepfryCommand } from './deepfry';
import { MediaIVE2ECommand } from './e2e';
import { MediaIVE2FCommand } from './e2f';
import { MediaIVExoCommand } from './exo';
import { MediaIVGlitchCommand } from './glitch';
import { MediaIVGlitchGifCommand } from './glitch-gif';
import { MediaIVGrainCommand } from './grain';
import { MediaIVJPEGCommand } from './jpeg';
import { MediaIVKek2Command } from './kek2';
import { MediaIVKekCommand } from './kek';
import { MediaIVPixelSortCommand } from './pixel-sort';
import { MediaIVPixelateCommand } from './pixelate';
import { MediaIVRGBSplitCommand } from './rgb-split';
import { MediaIVScrambleCommand } from './scramble';
import { MediaIVSwapPixelsCommand } from './swap-pixels';
import { MediaIVTVSimulatorCommand } from './tv-simulator';
import { MediaIVVHSCommand } from './vhs';


export default class MediaIVGlitchGroupCommand extends BaseSlashCommand {
  description = 'Glitch an image or video: datamosh, deepfry, JPEG and more';
  descriptionLocalizations = I18n.localizations('commands.media_iv_glitch.description');
  name = 'media-iv-glitch';

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
        new MediaIVDatamoshCommand(),
        new MediaIVDeepfryCommand(),
        new MediaIVE2ECommand(),
        new MediaIVE2FCommand(),
        new MediaIVExoCommand(),
        new MediaIVGlitchCommand(),
        new MediaIVGlitchGifCommand(),
        new MediaIVGrainCommand(),
        new MediaIVJPEGCommand(),
        new MediaIVKekCommand(),
        new MediaIVKek2Command(),
        new MediaIVPixelSortCommand(),
        new MediaIVPixelateCommand(),
        new MediaIVRGBSplitCommand(),
        new MediaIVScrambleCommand(),
        new MediaIVSwapPixelsCommand(),
        new MediaIVTVSimulatorCommand(),
        new MediaIVVHSCommand(),
      ],
    });
  }
}
