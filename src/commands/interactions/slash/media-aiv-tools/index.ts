import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MediaAIVAudioGroupCommand } from './audio';
import { MediaAIVToolsConcatCommand } from './concat';
import { MediaAIVToolsJoinCommand } from './join';
import { MediaAIVToolsOverlayCommand } from './overlay';
import { MediaAIVToolsReverseCommand } from './reverse';
import { MediaAIVToolsSeeSawCommand } from './seesaw';
import { MediaAIVToolsSnipCommand } from './snip';
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
        new MediaAIVAudioGroupCommand(),
        new MediaAIVToolsConcatCommand(),
        new MediaAIVToolsJoinCommand(),
        new MediaAIVToolsOverlayCommand(),
        new MediaAIVToolsReverseCommand(),
        new MediaAIVToolsSeeSawCommand(),
        new MediaAIVToolsSnipCommand(),
        new MediaAIVToolsSpeedCommand(),
      ],
    });
  }
}
