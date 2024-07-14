import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { VideoConvertCommand } from './convert';
import { VideoExtractGroupCommand } from './extract';


export default class VideoGroupCommand extends BaseSlashCommand {
  description = 'Video-Related Commands';
  name = 'v';

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
        new VideoConvertCommand(),
        new VideoExtractGroupCommand(),
      ],
    });
  }
}
