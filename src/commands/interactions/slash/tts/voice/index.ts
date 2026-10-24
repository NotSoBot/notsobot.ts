import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TTSVoiceCreateCommand } from './create';
import { TTSVoiceDeleteCommand } from './delete';
import { TTSVoiceListCommand } from './list';
import { TTSVoiceRenameCommand } from './rename';
import { TTSVoiceSampleCommand } from './sample';


// every subcommand needs premium plus, like the prefix commands
export class TTSVoiceGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Clone voices to use for Text-to-Speech';
  name = 'voice';

  constructor() {
    super({
      options: [
        new TTSVoiceCreateCommand(),
        new TTSVoiceDeleteCommand(),
        new TTSVoiceListCommand(),
        new TTSVoiceRenameCommand(),
        new TTSVoiceSampleCommand(),
      ],
    });
  }
}
