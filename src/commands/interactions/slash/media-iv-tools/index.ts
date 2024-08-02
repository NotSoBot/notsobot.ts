import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { ImageBackgroundGroupCommand } from './background';

import { ImageToolsConvertCommand } from './convert';
import { ImageToolsCropCommand } from './crop';
import { ImageToolsCropAutoCommand } from './crop-auto';
import { ImageToolsCropCircleCommand } from './crop-circle';
import { ImageToolsCropNFTCommand } from './crop-nft';
import { ImageToolsResizeCommand } from './resize';
import { ImageSharpenCommand } from './sharpen';
import { ImageToolsTrimCommand } from './trim';


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
        new ImageBackgroundGroupCommand(),
        new ImageToolsConvertCommand(),
        new ImageToolsCropCommand(),
        new ImageToolsCropAutoCommand(),
        new ImageToolsCropCircleCommand(),
        new ImageToolsCropNFTCommand(),
        new ImageToolsResizeCommand(),
        new ImageSharpenCommand(),
        new ImageToolsTrimCommand(),
      ],
    });
  }
}
