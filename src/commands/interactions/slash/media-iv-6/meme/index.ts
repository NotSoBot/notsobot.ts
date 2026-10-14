import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVMemeAdidasCommand } from './adidas';
import { MediaIVMemeAnalysisCommand } from './analysis';
import { MediaIVMemeAustinEvans1Command } from './austin';
import { MediaIVMemeBinocularsCommand } from './binoculars';
import { MediaIVMemeBlackPantherCommand } from './blackpanther';
import { MediaIVMemeCoolGuyCommand } from './coolguy';
import { MediaIVMemeDorkCommand } from './dork';
import { MediaIVMemeExcuseCommand } from './excuse';
import { MediaIVMemeGodCommand } from './god';
import { MediaIVMemeGoldStarCommand } from './goldstar';
import { MediaIVMemeJacksfilms1Command } from './jack';
import { MediaIVMemeJesus1Command } from './jesus';
import { MediaIVMemeOwOCommand } from './owo';


// meme templates ported from fapi, the /media-iv-4 `overlay` group didn't have room for them
export class MediaIVMemeGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Meme Template Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme.description');
  name = 'meme';
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme.name');

  constructor() {
    super({
      options: [
        new MediaIVMemeAdidasCommand(),
        new MediaIVMemeAnalysisCommand(),
        new MediaIVMemeAustinEvans1Command(),
        new MediaIVMemeBinocularsCommand(),
        new MediaIVMemeBlackPantherCommand(),
        new MediaIVMemeCoolGuyCommand(),
        new MediaIVMemeDorkCommand(),
        new MediaIVMemeExcuseCommand(),
        new MediaIVMemeGodCommand(),
        new MediaIVMemeGoldStarCommand(),
        new MediaIVMemeJacksfilms1Command(),
        new MediaIVMemeJesus1Command(),
        new MediaIVMemeOwOCommand(),
      ],
    });
  }
}
