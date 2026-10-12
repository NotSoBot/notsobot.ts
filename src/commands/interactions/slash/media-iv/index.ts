import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVConvertCommand } from './convert';
import { MediaIVFunGroupCommand } from './fun';
import { MediaIVLabelsGroupCommand } from './labels';
import { MediaIVTintGroupCommand } from './tint';


export default class MediaIVGroupCommand extends BaseSlashCommand {
  description = 'Image and Video Manipulation Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv.description');
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
        new MediaIVTintGroupCommand(),
      ],
    });
  }
}
