import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagAntiguaCommand } from './antigua';
import { MediaIVFlagBahamasCommand } from './bahamas';
import { MediaIVFlagBarbadosCommand } from './barbados';
import { MediaIVFlagBelizeCommand } from './belize';
import { MediaIVFlagCanadaCommand } from './canada';
import { MediaIVFlagCostaRicaCommand } from './costarica';
import { MediaIVFlagCubaCommand } from './cuba';
import { MediaIVFlagDominicaCommand } from './dominica';
import { MediaIVFlagDominicanRepublicCommand } from './dominicanrepublic';
import { MediaIVFlagElSalvadorCommand } from './elsalvador';
import { MediaIVFlagGrenadaCommand } from './grenada';
import { MediaIVFlagGuatemalaCommand } from './guatemala';
import { MediaIVFlagHaitiCommand } from './haiti';
import { MediaIVFlagHondurasCommand } from './honduras';
import { MediaIVFlagJamaicaCommand } from './jamaica';
import { MediaIVFlagMexicoCommand } from './mexico';
import { MediaIVFlagNicaraguaCommand } from './nicaragua';
import { MediaIVFlagPanamaCommand } from './panama';
import { MediaIVFlagSaintKittsCommand } from './saintkitts';
import { MediaIVFlagSaintLuciaCommand } from './saintlucia';
import { MediaIVFlagSaintVincentCommand } from './saintvincent';
import { MediaIVFlagTrinidadCommand } from './trinidad';
import { MediaIVOverlayUSACommand } from './usa';


export class MediaIVFlagAmericaNorthGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'North American Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_america.north.description');
  name = 'north';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_america.north.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagAntiguaCommand(),
        new MediaIVFlagBahamasCommand(),
        new MediaIVFlagBarbadosCommand(),
        new MediaIVFlagBelizeCommand(),
        new MediaIVFlagCanadaCommand(),
        new MediaIVFlagCostaRicaCommand(),
        new MediaIVFlagCubaCommand(),
        new MediaIVFlagDominicaCommand(),
        new MediaIVFlagDominicanRepublicCommand(),
        new MediaIVFlagElSalvadorCommand(),
        new MediaIVFlagGrenadaCommand(),
        new MediaIVFlagGuatemalaCommand(),
        new MediaIVFlagHaitiCommand(),
        new MediaIVFlagHondurasCommand(),
        new MediaIVFlagJamaicaCommand(),
        new MediaIVFlagMexicoCommand(),
        new MediaIVFlagNicaraguaCommand(),
        new MediaIVFlagPanamaCommand(),
        new MediaIVFlagSaintKittsCommand(),
        new MediaIVFlagSaintLuciaCommand(),
        new MediaIVFlagSaintVincentCommand(),
        new MediaIVFlagTrinidadCommand(),
        new MediaIVOverlayUSACommand(),
      ],
    });
  }
}
