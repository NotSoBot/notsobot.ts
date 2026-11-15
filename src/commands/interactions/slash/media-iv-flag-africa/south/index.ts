import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagBotswanaCommand } from './botswana';
import { MediaIVFlagEswatiniCommand } from './eswatini';
import { MediaIVFlagLesothoCommand } from './lesotho';
import { MediaIVFlagNamibiaCommand } from './namibia';
import { MediaIVFlagSouthAfricaCommand } from './southafrica';


export class MediaIVFlagAfricaSouthGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Southern African Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_africa.south.description');
  name = 'south';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_africa.south.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagBotswanaCommand(),
        new MediaIVFlagEswatiniCommand(),
        new MediaIVFlagLesothoCommand(),
        new MediaIVFlagNamibiaCommand(),
        new MediaIVFlagSouthAfricaCommand(),
      ],
    });
  }
}
