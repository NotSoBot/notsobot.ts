import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MediaAVAudioGroupCommand } from './audio';
import { MediaAVExtractGroupCommand } from './extract';
import { MediaAVStammerCommand } from './stammer';


export default class MediaAVGroupCommand extends BaseSlashCommand {
  description = 'Audio and Video Related Commands';
  name = 'media-av';

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
        new MediaAVAudioGroupCommand(),
        new MediaAVExtractGroupCommand(),
        new MediaAVStammerCommand(),
	  ],
	});
  }
}
