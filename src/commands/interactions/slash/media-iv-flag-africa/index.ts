import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVFlagAfricaCentralGroupCommand } from './central';
import { MediaIVFlagAfricaEastGroupCommand } from './east';
import { MediaIVFlagAfricaNorthGroupCommand } from './north';
import { MediaIVFlagAfricaSouthGroupCommand } from './south';
import { MediaIVFlagAfricaWestGroupCommand } from './west';


export default class MediaIVFlagAfricaGroupCommand extends BaseSlashCommand {
  description = 'Put African flags over an image or video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_africa.description');
  name = 'media-iv-flag-africa';

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
        new MediaIVFlagAfricaCentralGroupCommand(),
        new MediaIVFlagAfricaEastGroupCommand(),
        new MediaIVFlagAfricaNorthGroupCommand(),
        new MediaIVFlagAfricaSouthGroupCommand(),
        new MediaIVFlagAfricaWestGroupCommand(),
      ],
    });
  }
}
