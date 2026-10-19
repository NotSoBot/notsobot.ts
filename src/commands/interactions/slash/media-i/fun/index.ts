import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIEinsteinCommand } from './einstein';
import { MediaIFoggyWindowCommand } from './foggy-window';
import { MediaIHackerCommand } from './hacker';
import { MediaINeonCommand } from './neon';
import { MediaIPresidentialCommand } from './presidential';
import { MediaIRealfactCommand } from './realfact';
import { MediaIRetroCommand } from './retro';
import { MediaIRipCommand } from './rip';
import { MediaISnowWritingCommand } from './snow';
import { MediaISonicCommand } from './sonic';
import { MediaISoupCommand } from './soup';
import { MediaIThonkifyCommand } from './thonkify';
import { MediaITreeCarvingCommand } from './tree-carving';
import { MediaIWoodenSignCommand } from './wooden-sign';
import { MediaIWordcloudCommand } from './wordcloud';
import { MediaIYachtCommand } from './yacht';


export class MediaFunGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';
  nameLocalizations = I18n.localizations('commands.media_i.fun.name');

  constructor() {
    super({
      options: [
        new MediaIEinsteinCommand(),
        new MediaIFoggyWindowCommand(),
        new MediaIHackerCommand(),
        new MediaINeonCommand(),
        new MediaIPresidentialCommand(),
        new MediaIRealfactCommand(),
        new MediaIRetroCommand(),
        new MediaIRipCommand(),
        new MediaISnowWritingCommand(),
        new MediaISonicCommand(),
        new MediaISoupCommand(),
        new MediaIThonkifyCommand(),
        new MediaITreeCarvingCommand(),
        new MediaIWoodenSignCommand(),
        new MediaIWordcloudCommand(),
        new MediaIYachtCommand(),
      ],
    });
  }
}
