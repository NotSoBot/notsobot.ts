import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVFlagEuropeEastGroupCommand } from './east';
import { MediaIVFlagEuropeSouthGroupCommand } from './south';
import { MediaIVFlagEuropeWestGroupCommand } from './west';


export default class MediaIVFlagEuropeGroupCommand extends BaseSlashCommand {
  description = 'Put European flags over an image or video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_europe.description');
  name = 'media-iv-flag-europe';

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
        new MediaIVFlagEuropeEastGroupCommand(),
        new MediaIVFlagEuropeSouthGroupCommand(),
        new MediaIVFlagEuropeWestGroupCommand(),
      ],
    });
  }
}
