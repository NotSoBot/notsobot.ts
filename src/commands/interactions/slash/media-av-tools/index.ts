import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaAVToolsSetGroupCommand } from './set';


export default class MediaAVToolsGroupCommand extends BaseSlashCommand {
  description = 'Audio and Video Tool Commands';
  descriptionLocalizations = I18n.localizations('commands.media_av_tools.description');
  name = 'media-av-tools';

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
        new MediaAVToolsSetGroupCommand(),
      ],
    });
  }
}
