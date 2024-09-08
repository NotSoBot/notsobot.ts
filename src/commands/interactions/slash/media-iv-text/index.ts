import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVCaptionCommand } from './caption';
import { MediaIVMemeCommand } from './meme';
import { MediaIVRecaptionCommand } from './recaption';


export default class MediaIVTextGroupCommand extends BaseSlashCommand {
  description = 'Image and Video Text Commands';
  name = 'media-iv-text';

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
        new MediaIVCaptionCommand(),
        new MediaIVMemeCommand(),
        new MediaIVRecaptionCommand(),
      ],
    });
  }
}
