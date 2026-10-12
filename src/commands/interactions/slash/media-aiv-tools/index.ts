import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaAIVAudioGroupCommand } from './audio';


export default class MediaAIVToolsGroupCommand extends BaseSlashCommand {
  description = 'Audio, Image, and Video Tool Commands';
  descriptionLocalizations = I18n.localizations('commands.media_aiv_tools.description');
  name = 'media-aiv-tools';
  
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
        new MediaAIVAudioGroupCommand(),
      ],
    });
  }
}
