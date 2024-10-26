import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MediaAIVADHDCommand } from './adhd';
import { MediaAIVFadeInCommand } from './fade-in';
import { MediaAIVFadeOutCommand } from './fade-out';


export default class MediaAIVGroupCommand extends BaseSlashCommand {
  description = 'Audio, Image, and Video Manipulation Commands';
  name = 'media-aiv';

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
        new MediaAIVADHDCommand(),
        new MediaAIVFadeInCommand(),
        new MediaAIVFadeOutCommand(),
	  ],
	});
  }
}
