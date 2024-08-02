import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MediaAIVToolsReverseCommand } from './reverse';
import { MediaAIVToolsSeeSawCommand } from './seesaw';
import { MediaAIVToolsSpeedCommand } from './speed';


export default class MediaAIVToolsGroupCommand extends BaseSlashCommand {
  description = 'Audio, Image, and Video Tool Commands';
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
		new MediaAIVToolsReverseCommand(),
		new MediaAIVToolsSeeSawCommand(),
		new MediaAIVToolsSpeedCommand(),
	  ],
	});
  }
}
