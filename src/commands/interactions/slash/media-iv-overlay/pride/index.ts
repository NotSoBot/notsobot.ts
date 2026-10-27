import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagAsexualCommand } from './asexual';
import { MediaIVFlagBisexualCommand } from './bisexual';
import { MediaIVFlagLesbianCommand } from './lesbian';
import { MediaIVFlagMLMCommand } from './mlm';
import { MediaIVFlagNonBinaryCommand } from './nonbinary';
import { MediaIVFlagPansexualCommand } from './pansexual';
import { MediaIVOverlayGayCommand } from './gay';
import { MediaIVOverlayTransCommand } from './trans';


export class MediaIVPrideGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Pride Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_overlay.pride.description');
  name = 'pride';
  nameLocalizations = I18n.localizations('commands.media_iv_overlay.pride.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagAsexualCommand(),
        new MediaIVFlagBisexualCommand(),
        new MediaIVOverlayGayCommand(),
        new MediaIVFlagLesbianCommand(),
        new MediaIVFlagMLMCommand(),
        new MediaIVFlagNonBinaryCommand(),
        new MediaIVFlagPansexualCommand(),
        new MediaIVOverlayTransCommand(),
      ],
    });
  }
}
