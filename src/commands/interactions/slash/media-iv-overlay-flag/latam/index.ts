import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagArgentinaCommand } from './argentina';
import { MediaIVFlagBelizeCommand } from './belize';
import { MediaIVFlagBoliviaCommand } from './bolivia';
import { MediaIVFlagBrazilCommand } from './brazil';
import { MediaIVFlagChileCommand } from './chile';
import { MediaIVFlagColombiaCommand } from './colombia';
import { MediaIVFlagCostaRicaCommand } from './costarica';
import { MediaIVFlagEcuadorCommand } from './ecuador';
import { MediaIVFlagElSalvadorCommand } from './elsalvador';
import { MediaIVFlagGuatemalaCommand } from './guatemala';
import { MediaIVFlagGuyanaCommand } from './guyana';
import { MediaIVFlagHondurasCommand } from './honduras';
import { MediaIVFlagMexicoCommand } from './mexico';
import { MediaIVFlagNicaraguaCommand } from './nicaragua';
import { MediaIVFlagPanamaCommand } from './panama';
import { MediaIVFlagParaguayCommand } from './paraguay';
import { MediaIVFlagPeruCommand } from './peru';
import { MediaIVFlagSurinameCommand } from './suriname';
import { MediaIVFlagUruguayCommand } from './uruguay';
import { MediaIVFlagVenezuelaCommand } from './venezuela';


export class MediaIVOverlayFlagLatamGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Latin American Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_overlay_flag.latam.description');
  name = 'latam';
  nameLocalizations = I18n.localizations('commands.media_iv_overlay_flag.latam.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagArgentinaCommand(),
        new MediaIVFlagBelizeCommand(),
        new MediaIVFlagBoliviaCommand(),
        new MediaIVFlagBrazilCommand(),
        new MediaIVFlagChileCommand(),
        new MediaIVFlagColombiaCommand(),
        new MediaIVFlagCostaRicaCommand(),
        new MediaIVFlagEcuadorCommand(),
        new MediaIVFlagElSalvadorCommand(),
        new MediaIVFlagGuatemalaCommand(),
        new MediaIVFlagGuyanaCommand(),
        new MediaIVFlagHondurasCommand(),
        new MediaIVFlagMexicoCommand(),
        new MediaIVFlagNicaraguaCommand(),
        new MediaIVFlagPanamaCommand(),
        new MediaIVFlagParaguayCommand(),
        new MediaIVFlagPeruCommand(),
        new MediaIVFlagSurinameCommand(),
        new MediaIVFlagUruguayCommand(),
        new MediaIVFlagVenezuelaCommand(),
      ],
    });
  }
}
