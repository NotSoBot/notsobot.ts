import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVDistortCommand } from './distort';
import { MediaIVFlipCommand } from './flip';
import { MediaIVFlopCommand } from './flop';
import { MediaIVJPEGCommand } from './jpeg';
import { MediaAIVPipeCommand } from './pipe';
import { MediaIVShakeCommand } from './shake';
import { MediaIVSharpenCommand } from './sharpen';
import { MediaIVSpinCommand } from './spin';
import { MediaIVSwirlCommand } from './swirl';
import { MediaIVWaveCommand } from './wave';
import { MediaIVWavesCommand } from './waves';
// rip command

import { MediaFunGroupCommand } from './fun';
import { MediaLabelsGroupCommand } from './labels';
import { MediaOverlayGroupCommand } from './overlay';
import { MediaTintGroupCommand } from './tint';
// mirror


export default class MediaIVGroupCommand extends BaseSlashCommand {
  description = 'Image and Video Manipulation Commands';
  name = 'media-iv';

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
        new MediaIVDistortCommand(),
        new MediaIVFlipCommand(),
        new MediaIVFlopCommand(),
        new MediaFunGroupCommand(),
        new MediaIVJPEGCommand(),
        new MediaLabelsGroupCommand(),
        new MediaOverlayGroupCommand(),
        new MediaAIVPipeCommand(),
        new MediaIVShakeCommand(),
        new MediaIVSharpenCommand(),
        new MediaIVSpinCommand(),
        new MediaIVSwirlCommand,
        new MediaTintGroupCommand(),
        new MediaIVWaveCommand(),
        new MediaIVWavesCommand(),
      ],
    });
  }
}
