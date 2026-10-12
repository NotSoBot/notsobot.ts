import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAVToolsSetBitRateCommand } from './bitrate';


export class MediaAVToolsSetGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'set';
  nameLocalizations = I18n.localizations('commands.media_av_tools.set.name');

  constructor() {
    super({
      options: [
        new MediaAVToolsSetBitRateCommand(),
      ],
    });
  }
}
