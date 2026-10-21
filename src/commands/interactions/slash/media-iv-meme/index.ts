import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVMemePersonGroupCommand } from './person';
import { MediaIVMemeFormatGroupCommand } from './format';


export default class MediaIVMemeGroupCommand extends BaseSlashCommand {
  description = 'Put an image or video into a meme template';
  descriptionLocalizations = I18n.localizations('commands.media_iv_meme.description');
  name = 'media-iv-meme';

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
        new MediaIVMemePersonGroupCommand(),
        new MediaIVMemeFormatGroupCommand(),
      ],
    });
  }
}
