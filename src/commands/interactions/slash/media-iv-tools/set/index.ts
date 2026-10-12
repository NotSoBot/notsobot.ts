import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVToolsSetFPSCommand } from './fps';
import { MediaIVToolsSetFrameCountCommand } from './framecount';


export class MediaIVToolsSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';
  nameLocalizations = I18n.localizations('commands.media_iv_tools.set.name');

  constructor() {
    super({
      options: [
        new MediaIVToolsSetFPSCommand(),
        new MediaIVToolsSetFrameCountCommand(),
      ],
    });
  }
}
