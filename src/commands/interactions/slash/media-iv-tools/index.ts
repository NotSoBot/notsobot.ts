import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVToolsBackgroundGroupCommand } from './background';
import { MediaIVMirrorGroupCommand } from './mirror';
import { MediaIVToolsSetGroupCommand } from './set';

import { MediaIVToolsCropCommand } from './crop';
import { MediaIVToolsCropAutoCommand } from './crop-auto';
import { MediaIVToolsCropCircleCommand } from './crop-circle';
import { MediaIVToolsCropNFTCommand } from './crop-nft';
import { MediaIVToolsCropTriangleCommand } from './crop-triangle';
import { MediaIVToolsOffsetCommand } from './offset';
import { MediaIVToolsRotateCommand } from './rotate';
import { MediaIVToolsRotate3dCommand } from './rotate-3d';
import { MediaIVToolsResizeCommand } from './resize';
import { MediaIVToolsSnipFramesCommand } from './snip-frames';
import { MediaIVToolsToGifCommand } from './to-gif';
import { MediaIVToolsTrimCommand } from './trim';
import { MediaIVToolsUncaptionCommand } from './uncaption';
import { MediaIVToolsWatermarkCommand } from './watermark';
import { MediaIVConvertCommand } from './convert';
import { MediaIVFlipCommand } from './flip';
import { MediaIVFlopCommand } from './flop';
import { MediaIVStretchCommand } from './stretch';


export default class MediaIVToolsGroupCommand extends BaseSlashCommand {
  description = 'Crop, resize, rotate, convert and other image and video tools';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.description');
  name = 'media-iv-tools';

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
        new MediaIVToolsBackgroundGroupCommand(),
        new MediaIVToolsCropCommand(),
        new MediaIVToolsCropAutoCommand(),
        new MediaIVToolsCropCircleCommand(),
        new MediaIVToolsCropNFTCommand(),
        new MediaIVToolsCropTriangleCommand(),
        new MediaIVToolsOffsetCommand(),
        new MediaIVToolsRotateCommand(),
        new MediaIVToolsRotate3dCommand(),
        new MediaIVToolsResizeCommand(),
        new MediaIVToolsSetGroupCommand(),
        new MediaIVToolsSnipFramesCommand(),
        new MediaIVToolsToGifCommand(),
        new MediaIVToolsTrimCommand(),
        new MediaIVToolsUncaptionCommand(),
        new MediaIVToolsWatermarkCommand(),
        new MediaIVConvertCommand(),
        new MediaIVFlipCommand(),
        new MediaIVFlopCommand(),
        new MediaIVStretchCommand(),
        new MediaIVMirrorGroupCommand(),
      ],
    });
  }
}
