import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MediaFaceGroupCommand } from './face';
import { MediaFunGroupCommand } from './fun';
// mirror


export default class MediaIGroupCommand extends BaseSlashCommand {
  description = 'Image Manipulation Commands';
  name = 'media-i';

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
        new MediaFaceGroupCommand(),
        new MediaFunGroupCommand(),
      ],
    });
  }
}
