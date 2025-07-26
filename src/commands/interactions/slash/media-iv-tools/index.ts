import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVToolsBackgroundGroupCommand } from './background';
import { MediaIVToolsSetGroupCommand } from './set';

import { MediaIVToolsConvertCommand } from './convert';
import { MediaIVToolsCropCommand } from './crop';
import { MediaIVToolsCropAutoCommand } from './crop-auto';
import { MediaIVToolsCropCircleCommand } from './crop-circle';
import { MediaIVToolsCropNFTCommand } from './crop-nft';
import { MediaIVToolsOffsetCommand } from './offset';
import { MediaIVToolsRotateCommand } from './rotate';
import { MediaIVToolsRotate3dCommand } from './rotate-3d';
import { MediaIVToolsResizeCommand } from './resize';
import { MediaIVToolsSnipFramesCommand } from './snip-frames';
import { MediaIVToolsTrimCommand } from './trim';
import { MediaIVToolsUncaptionCommand } from './uncaption';


export default class MediaIVToolsGroupCommand extends BaseSlashCommand {
  description = 'Image and Video Tool Commands';
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
        new MediaIVToolsConvertCommand(),
        new MediaIVToolsCropCommand(),
        new MediaIVToolsCropAutoCommand(),
        new MediaIVToolsCropCircleCommand(),
        new MediaIVToolsCropNFTCommand(),
        new MediaIVToolsOffsetCommand(),
        new MediaIVToolsRotateCommand(),
        new MediaIVToolsRotate3dCommand(),
        new MediaIVToolsResizeCommand(),
        new MediaIVToolsSetGroupCommand(),
        new MediaIVToolsSnipFramesCommand(),
        new MediaIVToolsTrimCommand(),
        new MediaIVToolsUncaptionCommand(),
      ],
    });
  }
}
