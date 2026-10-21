import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVFlagAmericaNorthGroupCommand } from './north';
import { MediaIVFlagAmericaSouthGroupCommand } from './south';


export default class MediaIVFlagAmericaGroupCommand extends BaseSlashCommand {
  description = 'Put North and South American flags over an image or video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_america.description');
  name = 'media-iv-flag-america';

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
        new MediaIVFlagAmericaNorthGroupCommand(),
        new MediaIVFlagAmericaSouthGroupCommand(),
      ],
    });
  }
}
