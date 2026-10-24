import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVFlagAsiaCentralGroupCommand } from './central';
import { MediaIVFlagAsiaEastGroupCommand } from './east';
import { MediaIVFlagAsiaMiddleEastGroupCommand } from './middleeast';
import { MediaIVFlagAsiaSouthGroupCommand } from './south';
import { MediaIVFlagAsiaSoutheastGroupCommand } from './southeast';


export default class MediaIVFlagAsiaGroupCommand extends BaseSlashCommand {
  description = 'Put Asian flags over an image or video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_asia.description');
  name = 'media-iv-flag-asia';

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
        new MediaIVFlagAsiaCentralGroupCommand(),
        new MediaIVFlagAsiaEastGroupCommand(),
        new MediaIVFlagAsiaMiddleEastGroupCommand(),
        new MediaIVFlagAsiaSouthGroupCommand(),
        new MediaIVFlagAsiaSoutheastGroupCommand(),
      ],
    });
  }
}
