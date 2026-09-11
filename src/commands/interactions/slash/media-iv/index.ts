import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVConvertCommand } from './convert';
import { MediaIVFunGroupCommand } from './fun';
import { MediaIVLabelsGroupCommand } from './labels';
import { MediaIVOverlayGroupCommand } from './overlay';
import { MediaIVTintGroupCommand } from './tint';
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
        new MediaIVConvertCommand(),
        new MediaIVFunGroupCommand(),
        new MediaIVLabelsGroupCommand(),
        new MediaIVOverlayGroupCommand(),
        new MediaIVTintGroupCommand(),
      ],
    });
  }
}
