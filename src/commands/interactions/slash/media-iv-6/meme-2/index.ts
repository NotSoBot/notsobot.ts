import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVMeme9GagCommand } from './9gag';
import { MediaIVMemeAjitPai1Command } from './ajit';
import { MediaIVMemeBandicamCommand } from './bandicam';
import { MediaIVMemeHyperCamCommand } from './hypercam';
import { MediaIVMemeIDubbbz1Command } from './idubbbz';
import { MediaIVMemeKeemstar1Command } from './keem';
import { MediaIVMemeKeemstar2Command } from './keem2';
import { MediaIVMemeKirbyCommand } from './kirby';
import { MediaIVMemeMirandaCosgrove1Command } from './miranda';
import { MediaIVMemeMistakeCommand } from './mistake';
import { MediaIVMemeOldGuyCommand } from './oldguy';
import { MediaIVMemePerfectionCommand } from './perfection';
import { MediaIVMemeRespectsCommand } from './respects';
import { MediaIVMemeRTXCommand } from './rtx';
import { MediaIVMemeShutterstockCommand } from './stock';
import { MediaIVMemeSupremeCommand } from './supreme';
import { MediaIVMemeThinkingCommand } from './thinking';
import { MediaIVMemeTrump1Command } from './trump';
import { MediaIVMemeWheezeCommand } from './wheeze';
import { MediaIVMemeYusukeCommand } from './yusuke';
import { MediaIVMemeZuckerberg1Command } from './zuckerberg';


// more meme templates ported from fapi, the `meme` group didn't have room for them
export class MediaIVMeme2GroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'More Meme Template Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.description');
  name = 'meme-2';
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.name');

  constructor() {
    super({
      options: [
        new MediaIVMeme9GagCommand(),
        new MediaIVMemeAjitPai1Command(),
        new MediaIVMemeBandicamCommand(),
        new MediaIVMemeHyperCamCommand(),
        new MediaIVMemeIDubbbz1Command(),
        new MediaIVMemeKeemstar1Command(),
        new MediaIVMemeKeemstar2Command(),
        new MediaIVMemeKirbyCommand(),
        new MediaIVMemeMirandaCosgrove1Command(),
        new MediaIVMemeMistakeCommand(),
        new MediaIVMemeOldGuyCommand(),
        new MediaIVMemePerfectionCommand(),
        new MediaIVMemeRespectsCommand(),
        new MediaIVMemeRTXCommand(),
        new MediaIVMemeShutterstockCommand(),
        new MediaIVMemeSupremeCommand(),
        new MediaIVMemeThinkingCommand(),
        new MediaIVMemeTrump1Command(),
        new MediaIVMemeWheezeCommand(),
        new MediaIVMemeYusukeCommand(),
        new MediaIVMemeZuckerberg1Command(),
      ],
    });
  }
}
