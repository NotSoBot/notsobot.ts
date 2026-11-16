import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TTSVoiceServerCreateCommand } from './create';
import { TTSVoiceServerDeleteCommand } from './delete';
import { TTSVoiceServerListCommand } from './list';
import { TTSVoiceServerMoveCommand } from './move';
import { TTSVoiceServerRenameCommand } from './rename';
import { TTSVoiceServerSampleCommand } from './sample';


// the server's own cloned voices, everyone there can use them for tts. Any server can have a few (more with premium
// slots), changing them needs Manage Server. Only fish.audio (cloning on, moving to) and changing a fish.audio/ElevenLabs
// one needs credits
export class TTSVoiceServerGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'The server\'s own cloned voices, everyone here can use them';
  name = 'voice-server';

  constructor() {
    super({
      options: [
        new TTSVoiceServerCreateCommand(),
        new TTSVoiceServerDeleteCommand(),
        new TTSVoiceServerListCommand(),
        new TTSVoiceServerMoveCommand(),
        new TTSVoiceServerRenameCommand(),
        new TTSVoiceServerSampleCommand(),
      ],
    });
  }
}
