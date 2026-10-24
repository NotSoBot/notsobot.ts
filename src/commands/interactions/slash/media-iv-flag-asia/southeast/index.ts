import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagBruneiCommand } from './brunei';
import { MediaIVFlagCambodiaCommand } from './cambodia';
import { MediaIVFlagEastTimorCommand } from './easttimor';
import { MediaIVFlagIndonesiaCommand } from './indonesia';
import { MediaIVFlagLaosCommand } from './laos';
import { MediaIVFlagMalaysiaCommand } from './malaysia';
import { MediaIVFlagMyanmarCommand } from './myanmar';
import { MediaIVFlagPhilippinesCommand } from './philippines';
import { MediaIVFlagSingaporeCommand } from './singapore';
import { MediaIVFlagThailandCommand } from './thailand';
import { MediaIVFlagVietnamCommand } from './vietnam';


export class MediaIVFlagAsiaSoutheastGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Southeast Asian Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_asia.southeast.description');
  name = 'southeast';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_asia.southeast.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagBruneiCommand(),
        new MediaIVFlagCambodiaCommand(),
        new MediaIVFlagEastTimorCommand(),
        new MediaIVFlagIndonesiaCommand(),
        new MediaIVFlagLaosCommand(),
        new MediaIVFlagMalaysiaCommand(),
        new MediaIVFlagMyanmarCommand(),
        new MediaIVFlagPhilippinesCommand(),
        new MediaIVFlagSingaporeCommand(),
        new MediaIVFlagThailandCommand(),
        new MediaIVFlagVietnamCommand(),
      ],
    });
  }
}
