import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MusicVotePauseCommand } from './pause';
import { MusicVoteResumeCommand } from './resume';
import { MusicVoteSkipCommand } from './skip';


export class MusicVoteGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Change what the music needs votes for';
  name = 'vote';

  constructor() {
    super({
      options: [
        new MusicVotePauseCommand(),
        new MusicVoteResumeCommand(),
        new MusicVoteSkipCommand(),
      ],
    });
  }
}
