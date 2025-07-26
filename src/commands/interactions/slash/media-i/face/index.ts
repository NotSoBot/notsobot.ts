import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIAlienCommand } from './alien';
import { MediaIAnimeCommand } from './anime';
import { MediaIClownCommand } from './clown';
import { MediaIFatCommand } from './fat';


export class MediaFaceGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'face';

  constructor() {
    super({
      options: [
        new MediaIAlienCommand(),
        new MediaIAnimeCommand(),
        new MediaIClownCommand(),
        new MediaIFatCommand(),
      ],
    });
  }
}
