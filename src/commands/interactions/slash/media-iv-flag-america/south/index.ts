import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagArgentinaCommand } from './argentina';
import { MediaIVFlagBoliviaCommand } from './bolivia';
import { MediaIVFlagBrazilCommand } from './brazil';
import { MediaIVFlagChileCommand } from './chile';
import { MediaIVFlagColombiaCommand } from './colombia';
import { MediaIVFlagEcuadorCommand } from './ecuador';
import { MediaIVFlagGuyanaCommand } from './guyana';
import { MediaIVFlagParaguayCommand } from './paraguay';
import { MediaIVFlagPeruCommand } from './peru';
import { MediaIVFlagSurinameCommand } from './suriname';
import { MediaIVFlagUruguayCommand } from './uruguay';
import { MediaIVFlagVenezuelaCommand } from './venezuela';


export class MediaIVFlagAmericaSouthGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'South American Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_america.south.description');
  name = 'south';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_america.south.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagArgentinaCommand(),
        new MediaIVFlagBoliviaCommand(),
        new MediaIVFlagBrazilCommand(),
        new MediaIVFlagChileCommand(),
        new MediaIVFlagColombiaCommand(),
        new MediaIVFlagEcuadorCommand(),
        new MediaIVFlagGuyanaCommand(),
        new MediaIVFlagParaguayCommand(),
        new MediaIVFlagPeruCommand(),
        new MediaIVFlagSurinameCommand(),
        new MediaIVFlagUruguayCommand(),
        new MediaIVFlagVenezuelaCommand(),
      ],
    });
  }
}
