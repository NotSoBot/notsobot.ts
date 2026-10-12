import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlashCommand } from './flash';
import { MediaIVInOutCommand } from './in-out';
import { MediaIVOutInCommand } from './out-in';
import { MediaIVRainbowCommand } from './rainbow';
import { MediaIVSideToSideCommand } from './side-to-side';
import { MediaIVUpToDownCommand } from './up-to-down';


export class MediaAnimateGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Animation Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_3.animate.description');
  name = 'animate';
  nameLocalizations = I18n.localizations('commands.media_iv_3.animate.name');

  constructor() {
    super({
      options: [
        new MediaIVFlashCommand(),
        new MediaIVInOutCommand(),
        new MediaIVOutInCommand(),
        new MediaIVRainbowCommand(),
        new MediaIVSideToSideCommand(),
        new MediaIVUpToDownCommand(),
      ],
    });
  }
}
