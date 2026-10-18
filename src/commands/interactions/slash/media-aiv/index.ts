import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaAIVExtractGroupCommand } from './extract';

import { MediaAIVADHDCommand } from './adhd';
import { MediaAIVAndroidCommand } from './android';
import { MediaAIVConcatCommand } from './concat';
import { MediaAIVFadeInCommand } from './fade-in';
import { MediaAIVFadeOutCommand } from './fade-out';
import { MediaAIVJoinCommand } from './join';
import { MediaAIVOverlayCommand } from './overlay';
import { MediaAIVPipeCommand } from './pipe';
import { MediaAIVReverseCommand } from './reverse';
import { MediaAIVSeeSawCommand } from './seesaw';
import { MediaAIVShuffleCommand } from './shuffle';
import { MediaAIVSnipCommand } from './snip';
import { MediaAIVSpeedCommand } from './speed';
import { MediaAIVVegCommand } from './veg';


export default class MediaAIVGroupCommand extends BaseSlashCommand {
  description = 'Audio, Image, and Video Manipulation Commands';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.description');
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
        new MediaAIVAndroidCommand(),
        new MediaAIVConcatCommand(),
        new MediaAIVExtractGroupCommand(),
        new MediaAIVFadeInCommand(),
        new MediaAIVFadeOutCommand(),
        new MediaAIVJoinCommand(),
        new MediaAIVOverlayCommand(),
        new MediaAIVPipeCommand(),
        new MediaAIVReverseCommand(),
        new MediaAIVSeeSawCommand(),
        new MediaAIVShuffleCommand,
        new MediaAIVSnipCommand(),
        new MediaAIVSpeedCommand(),
        new MediaAIVVegCommand(),
	  ],
	});
  }
}
