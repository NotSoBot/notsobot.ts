import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaFunGroupCommand } from './fun';
// mirror


export default class MediaIGroupCommand extends BaseSlashCommand {
  description = 'Image Manipulation Commands';
  descriptionLocalizations = I18n.localizations('commands.media_i.description');
  name = 'media-i';

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
