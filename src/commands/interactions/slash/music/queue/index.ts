import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MusicQueueClearCommand } from './clear';
import { MusicQueueListCommand } from './list';
import { MusicQueueRemoveCommand } from './remove';


export class MusicQueueGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'See and change the music queue';
  name = 'queue';

  constructor() {
    super({
      options: [
        new MusicQueueClearCommand(),
        new MusicQueueListCommand(),
        new MusicQueueRemoveCommand(),
      ],
    });
  }
}
