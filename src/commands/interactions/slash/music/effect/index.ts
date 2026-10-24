import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MusicEffectAddCommand } from './add';
import { MusicEffectClearCommand } from './clear';
import { MusicEffectListCommand } from './list';
import { MusicEffectRemoveCommand } from './remove';


export class MusicEffectGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Live effects on the music, up to 5 stacked (premium, DJs change them)';
  name = 'effect';

  constructor() {
    super({
      options: [
        new MusicEffectAddCommand(),
        new MusicEffectClearCommand(),
        new MusicEffectListCommand(),
        new MusicEffectRemoveCommand(),
      ],
    });
  }
}
