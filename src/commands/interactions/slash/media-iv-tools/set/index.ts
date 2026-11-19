import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVToolsSetFPSCommand } from './fps';
import { MediaIVToolsSetFrameDelayCommand } from './frame-delay';
import { MediaIVToolsSetFrameCountCommand } from './framecount';
import { MediaIVToolsSetLoopCommand } from './loop';


export class MediaIVToolsSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Change an image or video\'s FPS, frame count, frame delay or loop count';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.set.description');
  name = 'set';
  nameLocalizations = I18n.localizations('commands.media_iv_tools.set.name');

  constructor() {
    super({
      options: [
        new MediaIVToolsSetFPSCommand(),
        new MediaIVToolsSetFrameDelayCommand(),
        new MediaIVToolsSetFrameCountCommand(),
        new MediaIVToolsSetLoopCommand(),
      ],
    });
  }
}
