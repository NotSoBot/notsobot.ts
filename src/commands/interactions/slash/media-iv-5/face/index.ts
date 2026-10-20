import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVAlienCommand } from './alien';
import { MediaIVAnimeCommand } from './anime';
import { MediaIVClownCommand } from './clown';
import { MediaIVFatCommand } from './fat';
import { MediaIVHalloweenHatCommand } from './halloween-hat';
import { MediaIVKirkCommand } from './kirk';
import { MediaIVKnightCommand } from './knight';
import { MediaIVLeninCommand } from './lenin';
import { MediaIVMonaLisaCommand } from './mona-lisa';
import { MediaIVMountRushmoreCommand } from './mount-rushmore';
import { MediaIVFaceSwapCommand } from './swap';
import { MediaIVXmasCapCommand } from './xmas-cap';


export class MediaFace5GroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'face';
  nameLocalizations = I18n.localizations('commands.media_iv_5.face.name');

  constructor() {
    super({
      options: [
        new MediaIVAlienCommand(),
        new MediaIVAnimeCommand(),
        new MediaIVClownCommand(),
        new MediaIVFatCommand(),
        new MediaIVHalloweenHatCommand(),
        new MediaIVKirkCommand(),
        new MediaIVKnightCommand(),
        new MediaIVLeninCommand(),
        new MediaIVMonaLisaCommand(),
        new MediaIVMountRushmoreCommand(),
        new MediaIVFaceSwapCommand(),
        new MediaIVXmasCapCommand(),
      ],
    });
  }
}
