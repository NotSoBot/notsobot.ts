import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVMemeGroupCommand } from './meme';
import { MediaIVMeme2GroupCommand } from './meme-2';
import { MediaMood6GroupCommand } from './mood';


export default class MediaIV6GroupCommand extends BaseSlashCommand {
  description = 'Image and Video Manipulation Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.description');
  name = 'media-iv-6';

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
        new MediaIVMemeGroupCommand(),
        new MediaIVMeme2GroupCommand(),
        new MediaMood6GroupCommand(),
      ],
    });
  }
}
