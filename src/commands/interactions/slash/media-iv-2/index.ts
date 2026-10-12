import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaFunGroupCommand } from './fun';


export default class MediaIV2GroupCommand extends BaseSlashCommand {
  description = 'Image and Video Manipulation Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.description');
  name = 'media-iv-2';

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
        new MediaFunGroupCommand(),
      ],
    });
  }
}
