import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MusicInfoCommand } from './info';
import { MusicLeaveCommand } from './leave';
import { MusicPauseCommand } from './pause';
import { MusicPlayCommand } from './play';
import { MusicQueueGroupCommand } from './queue';
import { MusicResumeCommand } from './resume';
import { MusicSeekCommand } from './seek';
import { MusicSkipCommand } from './skip';


// servers only (the bot has to be in the voice channel's server). each subcommand is premium: premium users, premium
// servers and servers given `MUSIC_ACCESS`, like the prefix commands
export default class MusicCommand extends BaseSlashCommand {
  description = 'Play music in your voice channel';
  name = 'music';

  contexts = [
    InteractionContextTypes.GUILD,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new MusicInfoCommand(),
        new MusicLeaveCommand(),
        new MusicPauseCommand(),
        new MusicPlayCommand(),
        new MusicQueueGroupCommand(),
        new MusicResumeCommand(),
        new MusicSeekCommand(),
        new MusicSkipCommand(),
      ],
    });
  }

}
