import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVMemeAjitPai1Command } from './ajit';
import { MediaIVMemeAustinEvans1Command } from './austin';
import { MediaIVMemeBinocularsCommand } from './binoculars';
import { MediaIVMemeBlackPantherCommand } from './blackpanther';
import { MediaIVMemeDorkCommand } from './dork';
import { MediaIVMemeIDubbbz1Command } from './idubbbz';
import { MediaIVMemeJacksfilms1Command } from './jack';
import { MediaIVMemeJesus1Command } from './jesus';
import { MediaIVMemeKeemstar1Command } from './keem';
import { MediaIVMemeKeemstar2Command } from './keem2';
import { MediaIVMemeMirandaCosgrove1Command } from './miranda';
import { MediaIVMemeMistakeCommand } from './mistake';
import { MediaIVMemeOldGuyCommand } from './oldguy';
import { MediaIVMemeOwOCommand } from './owo';
import { MediaIVMemeRespectsCommand } from './respects';
import { MediaIVMemeStephenHawking1Command } from './hawking';
import { MediaIVMemeTrump1Command } from './trump';
import { MediaIVMemeYusukeCommand } from './yusuke';
import { MediaIVOverlayBernieCommand } from './bernie';
import { MediaIVOverlayBobRossCommand } from './bob.ross';
import { MediaIVOverlayGabenCommand } from './gaben';
import { MediaIVOverlayLinusCommand } from './linus';
import { MediaIVOverlayStarmanCommand } from './starman';
import { MediaIVOverlayWhoDidThisCommand } from './who-did-this';


export class MediaIVMemePersonGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Meme Templates with a Person';
  descriptionLocalizations = I18n.localizations('commands.media_iv_meme.person.description');
  name = 'person';
  nameLocalizations = I18n.localizations('commands.media_iv_meme.person.name');

  constructor() {
    super({
      options: [
        new MediaIVMemeAjitPai1Command(),
        new MediaIVMemeAustinEvans1Command(),
        new MediaIVOverlayBernieCommand(),
        new MediaIVMemeBinocularsCommand(),
        new MediaIVMemeBlackPantherCommand(),
        new MediaIVOverlayBobRossCommand(),
        new MediaIVMemeDorkCommand(),
        new MediaIVOverlayGabenCommand(),
        new MediaIVMemeStephenHawking1Command(),
        new MediaIVMemeIDubbbz1Command(),
        new MediaIVMemeJacksfilms1Command(),
        new MediaIVMemeJesus1Command(),
        new MediaIVMemeKeemstar1Command(),
        new MediaIVMemeKeemstar2Command(),
        new MediaIVOverlayLinusCommand(),
        new MediaIVMemeMirandaCosgrove1Command(),
        new MediaIVMemeMistakeCommand(),
        new MediaIVMemeOldGuyCommand(),
        new MediaIVMemeOwOCommand(),
        new MediaIVMemeRespectsCommand(),
        new MediaIVOverlayStarmanCommand(),
        new MediaIVMemeTrump1Command(),
        new MediaIVOverlayWhoDidThisCommand(),
        new MediaIVMemeYusukeCommand(),
      ],
    });
  }
}
