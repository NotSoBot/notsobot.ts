import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaAnimateGroupCommand } from './animate';


// split off of /media-iv-3, which went over discord's 8000 character command size limit
export default class MediaIV5GroupCommand extends BaseSlashCommand {
  description = 'Image and Video Manipulation Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.description');
  name = 'media-iv-5';

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
        new MediaAnimateGroupCommand(),
      ],
    });
  }
}
