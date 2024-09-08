import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaAIVAudioPutConcatCommand } from './put-concat';
import { MediaAIVAudioPutMixCommand } from './put-mix';
import { MediaAIVAudioPutReplaceCommand } from './put-replace';


export class MediaAIVAudioGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'audio';

  constructor() {
    super({
      options: [
        new MediaAIVAudioPutConcatCommand(),
        new MediaAIVAudioPutMixCommand(),
        new MediaAIVAudioPutReplaceCommand(),
      ],
    });
  }
}
