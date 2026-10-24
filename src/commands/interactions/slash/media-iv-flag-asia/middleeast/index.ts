import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagBahrainCommand } from './bahrain';
import { MediaIVFlagCyprusCommand } from './cyprus';
import { MediaIVFlagEgyptCommand } from './egypt';
import { MediaIVFlagIranCommand } from './iran';
import { MediaIVFlagIraqCommand } from './iraq';
import { MediaIVOverlayIsraelCommand } from './israel';
import { MediaIVFlagJordanCommand } from './jordan';
import { MediaIVFlagKuwaitCommand } from './kuwait';
import { MediaIVFlagLebanonCommand } from './lebanon';
import { MediaIVFlagOmanCommand } from './oman';
import { MediaIVFlagPalestineCommand } from './palestine';
import { MediaIVFlagQatarCommand } from './qatar';
import { MediaIVFlagSaudiArabiaCommand } from './saudiarabia';
import { MediaIVFlagSyriaCommand } from './syria';
import { MediaIVFlagTurkeyCommand } from './turkey';
import { MediaIVFlagUAECommand } from './uae';
import { MediaIVFlagYemenCommand } from './yemen';


export class MediaIVFlagAsiaMiddleEastGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Middle Eastern Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_asia.middleeast.description');
  name = 'middleeast';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_asia.middleeast.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagBahrainCommand(),
        new MediaIVFlagCyprusCommand(),
        new MediaIVFlagEgyptCommand(),
        new MediaIVFlagIranCommand(),
        new MediaIVFlagIraqCommand(),
        new MediaIVOverlayIsraelCommand(),
        new MediaIVFlagJordanCommand(),
        new MediaIVFlagKuwaitCommand(),
        new MediaIVFlagLebanonCommand(),
        new MediaIVFlagOmanCommand(),
        new MediaIVFlagPalestineCommand(),
        new MediaIVFlagQatarCommand(),
        new MediaIVFlagSaudiArabiaCommand(),
        new MediaIVFlagSyriaCommand(),
        new MediaIVFlagTurkeyCommand(),
        new MediaIVFlagUAECommand(),
        new MediaIVFlagYemenCommand(),
      ],
    });
  }
}
