import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIBillCommand } from './bill';
import { MediaIBurnCommand } from './burn';
import { MediaIHackerCommand } from './hacker';
import { MediaILatteCommand } from './latte';
import { MediaIPresidentialCommand } from './presidential';
import { MediaIRealfactCommand } from './realfact';
import { MediaIRetroCommand } from './retro';
import { MediaIRipCommand } from './rip';
import { MediaISonicCommand } from './sonic';
import { MediaIThonkifyCommand } from './thonkify';
import { MediaIWordcloudCommand } from './wordcloud';


export class MediaFunGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';
  nameLocalizations = I18n.localizations('commands.media_i.fun.name');

  constructor() {
    super({
      options: [
        new MediaIBillCommand(),
        new MediaIBurnCommand(),
        new MediaIHackerCommand(),
        new MediaILatteCommand(),
        new MediaIPresidentialCommand(),
        new MediaIRealfactCommand(),
        new MediaIRetroCommand(),
        new MediaIRipCommand(),
        new MediaISonicCommand(),
        new MediaIThonkifyCommand(),
        new MediaIWordcloudCommand(),
      ],
    });
  }
}
