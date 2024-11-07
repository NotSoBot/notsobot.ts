import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MediaFunGroupCommand } from './fun';
import { MediaFun2GroupCommand } from './fun2';
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
        new MediaFunGroupCommand(),
        new MediaFun2GroupCommand(),
        new MediaLabelsGroupCommand(),
        new MediaOverlayGroupCommand(),
        new MediaTintGroupCommand(),
      ],
    });
  }
}
