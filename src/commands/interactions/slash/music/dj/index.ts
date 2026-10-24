import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MusicDjModeCommand } from './mode';
import { MusicDjRoleCommand } from './role';


export class MusicDjGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Who controls the music';
  name = 'dj';

  constructor() {
    super({
      options: [
        new MusicDjModeCommand(),
        new MusicDjRoleCommand(),
      ],
    });
  }
}
