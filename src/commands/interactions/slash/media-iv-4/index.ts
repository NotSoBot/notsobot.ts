import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVEyesGroupCommand } from './eyes';
import { MediaIVFlagGroupCommand } from './flag';
import { MediaIVMirrorGroupCommand } from './mirror';
import { MediaIVOverlayGroupCommand } from './overlay';


export default class MediaIV4GroupCommand extends BaseSlashCommand {
  description = 'Image and Video Manipulation Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.description');
  name = 'media-iv-4';

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
        new MediaIVEyesGroupCommand(),
        new MediaIVFlagGroupCommand(),
        new MediaIVMirrorGroupCommand(),
        new MediaIVOverlayGroupCommand(),
      ],
    });
  }
}
