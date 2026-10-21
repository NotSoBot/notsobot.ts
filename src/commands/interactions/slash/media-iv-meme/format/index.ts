import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVLabelsIFunnyCommand } from './ifunny';
import { MediaIVLabelsTriggered2Command } from './triggered-2';
import { MediaIVLabelsTriggered3Command } from './triggered-3';
import { MediaIVMemeAnalysisCommand } from './analysis';
import { MediaIVMemeCoolGuyCommand } from './coolguy';
import { MediaIVMemeExcuseCommand } from './excuse';
import { MediaIVMemeGodCommand } from './god';
import { MediaIVMemeKirbyCommand } from './kirby';
import { MediaIVMemePerfectionCommand } from './perfection';
import { MediaIVMemeRTXCommand } from './rtx';
import { MediaIVMemeThinkingCommand } from './thinking';
import { MediaIVMemeWheezeCommand } from './wheeze';
import { MediaIVMemeZuckerberg1Command } from './zuckerberg';
import { MediaIVTriggeredCommand } from './triggered';


export class MediaIVMemeFormatGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Meme Format Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_meme.format.description');
  name = 'format';
  nameLocalizations = I18n.localizations('commands.media_iv_meme.format.name');

  constructor() {
    super({
      options: [
        new MediaIVMemeAnalysisCommand(),
        new MediaIVMemeCoolGuyCommand(),
        new MediaIVMemeExcuseCommand(),
        new MediaIVMemeGodCommand(),
        new MediaIVLabelsIFunnyCommand(),
        new MediaIVMemeKirbyCommand(),
        new MediaIVMemePerfectionCommand(),
        new MediaIVMemeRTXCommand(),
        new MediaIVMemeThinkingCommand(),
        new MediaIVTriggeredCommand(),
        new MediaIVLabelsTriggered2Command(),
        new MediaIVLabelsTriggered3Command(),
        new MediaIVMemeWheezeCommand(),
        new MediaIVMemeZuckerberg1Command(),
      ],
    });
  }
}
