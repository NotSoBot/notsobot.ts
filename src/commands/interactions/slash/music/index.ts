import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { MusicEffectCommand } from './effect';
import { MusicFairCommand } from './fair';
import { MusicHistoryCommand } from './history';
import { MusicInfoCommand } from './info';
import { MusicLeaveCommand } from './leave';
import { MusicLoopCommand } from './loop';
import { MusicPauseCommand } from './pause';
import { MusicPlayCommand } from './play';
import { MusicQueueGroupCommand } from './queue';
import { MusicReplayCommand } from './replay';
import { MusicResumeCommand } from './resume';
import { MusicRulesCommand } from './rules';
import { MusicSeekCommand } from './seek';
import { MusicSkipCommand } from './skip';
import { MusicStayCommand } from './stay';
import { MusicVoteGroupCommand } from './vote';


// servers only (the bot has to be in the voice channel's server), for everyone. 24/7 and the bigger queue are premium
// server perks (or `MUSIC_ACCESS`), the api checks. So are effects, `music effect` checks the api's `premium`
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
        new MusicStayCommand(),
        new MusicEffectCommand(),
        new MusicFairCommand(),
        new MusicHistoryCommand(),
        new MusicInfoCommand(),
        new MusicLeaveCommand(),
        new MusicLoopCommand(),
        new MusicPauseCommand(),
        new MusicPlayCommand(),
        new MusicQueueGroupCommand(),
        new MusicReplayCommand(),
        new MusicResumeCommand(),
        new MusicRulesCommand(),
        new MusicSeekCommand(),
        new MusicSkipCommand(),
        new MusicVoteGroupCommand(),
      ],
    });
  }

}
