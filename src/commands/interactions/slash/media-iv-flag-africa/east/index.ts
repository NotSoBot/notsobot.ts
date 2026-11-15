import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagBurundiCommand } from './burundi';
import { MediaIVFlagComorosCommand } from './comoros';
import { MediaIVFlagDjiboutiCommand } from './djibouti';
import { MediaIVFlagEritreaCommand } from './eritrea';
import { MediaIVFlagEthiopiaCommand } from './ethiopia';
import { MediaIVFlagKenyaCommand } from './kenya';
import { MediaIVFlagMadagascarCommand } from './madagascar';
import { MediaIVFlagMalawiCommand } from './malawi';
import { MediaIVFlagMauritiusCommand } from './mauritius';
import { MediaIVFlagMozambiqueCommand } from './mozambique';
import { MediaIVFlagRwandaCommand } from './rwanda';
import { MediaIVFlagSeychellesCommand } from './seychelles';
import { MediaIVFlagSomaliaCommand } from './somalia';
import { MediaIVFlagSouthSudanCommand } from './southsudan';
import { MediaIVFlagTanzaniaCommand } from './tanzania';
import { MediaIVFlagUgandaCommand } from './uganda';
import { MediaIVFlagZambiaCommand } from './zambia';
import { MediaIVFlagZimbabweCommand } from './zimbabwe';


export class MediaIVFlagAfricaEastGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'East African Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_africa.east.description');
  name = 'east';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_africa.east.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagBurundiCommand(),
        new MediaIVFlagComorosCommand(),
        new MediaIVFlagDjiboutiCommand(),
        new MediaIVFlagEritreaCommand(),
        new MediaIVFlagEthiopiaCommand(),
        new MediaIVFlagKenyaCommand(),
        new MediaIVFlagMadagascarCommand(),
        new MediaIVFlagMalawiCommand(),
        new MediaIVFlagMauritiusCommand(),
        new MediaIVFlagMozambiqueCommand(),
        new MediaIVFlagRwandaCommand(),
        new MediaIVFlagSeychellesCommand(),
        new MediaIVFlagSomaliaCommand(),
        new MediaIVFlagSouthSudanCommand(),
        new MediaIVFlagTanzaniaCommand(),
        new MediaIVFlagUgandaCommand(),
        new MediaIVFlagZambiaCommand(),
        new MediaIVFlagZimbabweCommand(),
      ],
    });
  }
}
