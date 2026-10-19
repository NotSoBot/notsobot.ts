import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVAngryCommand } from './angry';
import { MediaIVGrumpyCommand } from './grumpy';
import { MediaIVMimicCommand } from './mimic';
import { MediaIVSadCommand } from './sad';
import { MediaIVSmileCommand } from './smile';
import { MediaIVSmugCommand } from './smug';
import { MediaIVSurprisedCommand } from './surprised';


export class MediaMood6GroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'mood';
  nameLocalizations = I18n.localizations('commands.media_iv_6.mood.name');

  constructor() {
    super({
      options: [
        new MediaIVAngryCommand(),
        new MediaIVGrumpyCommand(),
        new MediaIVMimicCommand(),
        new MediaIVSadCommand(),
        new MediaIVSmileCommand(),
        new MediaIVSmugCommand(),
        new MediaIVSurprisedCommand(),
      ],
    });
  }
}
