import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagAngolaCommand } from './angola';
import { MediaIVFlagCameroonCommand } from './cameroon';
import { MediaIVFlagCentralAfricanRepublicCommand } from './centralafricanrepublic';
import { MediaIVFlagChadCommand } from './chad';
import { MediaIVFlagCongoCommand } from './congo';
import { MediaIVFlagDRCongoCommand } from './drcongo';
import { MediaIVFlagEquatorialGuineaCommand } from './equatorialguinea';
import { MediaIVFlagGabonCommand } from './gabon';
import { MediaIVFlagSaoTomeCommand } from './saotome';


export class MediaIVFlagAfricaCentralGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Central African Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_africa.central.description');
  name = 'central';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_africa.central.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagAngolaCommand(),
        new MediaIVFlagCameroonCommand(),
        new MediaIVFlagCentralAfricanRepublicCommand(),
        new MediaIVFlagChadCommand(),
        new MediaIVFlagCongoCommand(),
        new MediaIVFlagDRCongoCommand(),
        new MediaIVFlagEquatorialGuineaCommand(),
        new MediaIVFlagGabonCommand(),
        new MediaIVFlagSaoTomeCommand(),
      ],
    });
  }
}
