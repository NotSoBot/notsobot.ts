import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVAdjustBrightnessCommand } from './brightness';
import { MediaIVAdjustContrastCommand } from './contrast';
import { MediaIVAdjustContrastMultiplyCommand } from './contrast-multiply';
import { MediaIVAdjustCropTransparencyCommand } from './crop-transparency';
import { MediaIVAdjustOpacityCommand } from './opacity';


export default class MediaIVAdjustGroupCommand extends BaseSlashCommand {
  description = 'Adjust an image or video\'s brightness, contrast and transparency';
  descriptionLocalizations = I18n.localizations('commands.media_iv_adjust.description');
  name = 'media-iv-adjust';

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
        new MediaIVAdjustBrightnessCommand(),
        new MediaIVAdjustContrastCommand(),
        new MediaIVAdjustContrastMultiplyCommand(),
        new MediaIVAdjustCropTransparencyCommand(),
        new MediaIVAdjustOpacityCommand(),
      ],
    });
  }
}
