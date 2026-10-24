import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagAfghanistanCommand } from './afghanistan';
import { MediaIVFlagBangladeshCommand } from './bangladesh';
import { MediaIVFlagBhutanCommand } from './bhutan';
import { MediaIVFlagIndiaCommand } from './india';
import { MediaIVFlagMaldivesCommand } from './maldives';
import { MediaIVFlagNepalCommand } from './nepal';
import { MediaIVFlagPakistanCommand } from './pakistan';
import { MediaIVFlagSriLankaCommand } from './srilanka';
import { MediaIVFlagTalibanCommand } from './taliban';


export class MediaIVFlagAsiaSouthGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'South Asian Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_asia.south.description');
  name = 'south';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_asia.south.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagAfghanistanCommand(),
        new MediaIVFlagBangladeshCommand(),
        new MediaIVFlagBhutanCommand(),
        new MediaIVFlagIndiaCommand(),
        new MediaIVFlagMaldivesCommand(),
        new MediaIVFlagNepalCommand(),
        new MediaIVFlagPakistanCommand(),
        new MediaIVFlagSriLankaCommand(),
        new MediaIVFlagTalibanCommand(),
      ],
    });
  }
}
