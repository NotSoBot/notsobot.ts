import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { MediaIVAchievementCommand } from './achievement';
import { MediaIVCaptionCommand } from './caption';
import { MediaIVDemotivateCommand } from './demotivate';
import { MediaIVMemeCommand } from './meme';
import { MediaIVNewsCommand } from './news';
import { MediaIVNotificationCommand } from './notification';
import { MediaIVRecaptionCommand } from './recaption';
import { MediaIVSnapchatCommand } from './snapchat';
import { MediaIVSubtitleCommand } from './subtitle';
import { MediaIVTikTokCommand } from './tiktok';
import { MediaIVVaporwaveCommand } from './vaporwave';
import { MediaIVVegasTimecodeCommand } from './vegas-timecode';
import { MediaIVWatchMojoCommand } from './watchmojo';
import { MediaIVYouTubeCommand } from './youtube';


export default class MediaIVTextGroupCommand extends BaseSlashCommand {
  description = 'Add text to an image or video: captions, memes and more';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.description');
  name = 'media-iv-text';

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
        new MediaIVAchievementCommand(),
        new MediaIVCaptionCommand(),
        new MediaIVDemotivateCommand(),
        new MediaIVMemeCommand(),
        new MediaIVNewsCommand(),
        new MediaIVNotificationCommand(),
        new MediaIVRecaptionCommand(),
        new MediaIVSnapchatCommand(),
        new MediaIVSubtitleCommand(),
        new MediaIVTikTokCommand(),
        new MediaIVVaporwaveCommand(),
        new MediaIVVegasTimecodeCommand(),
        new MediaIVWatchMojoCommand(),
        new MediaIVYouTubeCommand(),
      ],
    });
  }
}
