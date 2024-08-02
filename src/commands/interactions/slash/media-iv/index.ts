import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVFlipCommand } from './flip';
import { MediaIVFlopCommand } from './flop';
import { MediaIVJPEGCommand } from './jpeg';
import { MediaAIVPipeCommand } from './pipe';
import { MediaIVSharpenCommand } from './sharpen';
import { MediaIVSpinCommand } from './spin';
// rip command

import { MediaFunGroupCommand } from './fun';
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
        new MediaIVFlipCommand(),
        new MediaIVFlopCommand(),
        new MediaFunGroupCommand(),
        new MediaIVJPEGCommand(),
        new MediaOverlayGroupCommand(),
        new MediaAIVPipeCommand(),
        new MediaIVSharpenCommand(),
        new MediaIVSpinCommand(),
        new MediaTintGroupCommand(),
      ],
    });
  }
}
