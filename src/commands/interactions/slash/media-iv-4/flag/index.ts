import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagAsexualCommand } from './asexual';
import { MediaIVFlagBisexualCommand } from './bisexual';
import { MediaIVFlagBrazilCommand } from './brazil';
import { MediaIVFlagCanadaCommand } from './canada';
import { MediaIVFlagChinaCommand } from './china';
import { MediaIVFlagEUCommand } from './eu';
import { MediaIVFlagFranceCommand } from './france';
import { MediaIVFlagGermanyCommand } from './germany';
import { MediaIVFlagIndiaCommand } from './india';
import { MediaIVFlagIrelandCommand } from './ireland';
import { MediaIVFlagJapanCommand } from './japan';
import { MediaIVFlagLesbianCommand } from './lesbian';
import { MediaIVFlagMexicoCommand } from './mexico';
import { MediaIVFlagNonBinaryCommand } from './nonbinary';
import { MediaIVFlagPalestineCommand } from './palestine';
import { MediaIVFlagPansexualCommand } from './pansexual';
import { MediaIVFlagUkraineCommand } from './ukraine';


export class MediaIVFlagGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.description');
  name = 'flag';
  nameLocalizations = I18n.localizations('commands.media_iv.flag.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagAsexualCommand(),
        new MediaIVFlagBisexualCommand(),
        new MediaIVFlagBrazilCommand(),
        new MediaIVFlagCanadaCommand(),
        new MediaIVFlagChinaCommand(),
        new MediaIVFlagEUCommand(),
        new MediaIVFlagFranceCommand(),
        new MediaIVFlagGermanyCommand(),
        new MediaIVFlagIndiaCommand(),
        new MediaIVFlagIrelandCommand(),
        new MediaIVFlagJapanCommand(),
        new MediaIVFlagLesbianCommand(),
        new MediaIVFlagMexicoCommand(),
        new MediaIVFlagNonBinaryCommand(),
        new MediaIVFlagPalestineCommand(),
        new MediaIVFlagPansexualCommand(),
        new MediaIVFlagUkraineCommand(),
      ],
    });
  }
}
