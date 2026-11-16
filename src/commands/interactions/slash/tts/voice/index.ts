import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TTSVoiceCreateCommand } from './create';
import { TTSVoiceDeleteCommand } from './delete';
import { TTSVoiceListCommand } from './list';
import { TTSVoiceMoveCommand } from './move';
import { TTSVoiceRenameCommand } from './rename';
import { TTSVoiceSampleCommand } from './sample';


// anyone can clone a few voices (ZONOS3, free), premium gets more. Cloning on or moving to fish.audio, or adding audio to a
// fish.audio or ElevenLabs voice, needs premium plus or NotSoCredits (checked before the confirmation, and by the api)
export class TTSVoiceGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Clone voices to use for Text-to-Speech';
  name = 'voice';

  constructor() {
    super({
      options: [
        new TTSVoiceCreateCommand(),
        new TTSVoiceDeleteCommand(),
        new TTSVoiceListCommand(),
        new TTSVoiceMoveCommand(),
        new TTSVoiceRenameCommand(),
        new TTSVoiceSampleCommand(),
      ],
    });
  }
}
