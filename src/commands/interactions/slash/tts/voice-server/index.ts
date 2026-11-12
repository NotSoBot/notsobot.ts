import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TTSVoiceServerCreateCommand } from './create';
import { TTSVoiceServerDeleteCommand } from './delete';
import { TTSVoiceServerListCommand } from './list';
import { TTSVoiceServerRenameCommand } from './rename';
import { TTSVoiceServerSampleCommand } from './sample';


// the server's own cloned voices, everyone there can use them for tts. Making one (or adding audio) needs a member's
// premium plus on the server or NotSoCredits given to it (the api checks), changing them needs Manage Server
export class TTSVoiceServerGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'The server\'s own cloned voices, everyone here can use them';
  name = 'voice-server';

  constructor() {
    super({
      options: [
        new TTSVoiceServerCreateCommand(),
        new TTSVoiceServerDeleteCommand(),
        new TTSVoiceServerListCommand(),
        new TTSVoiceServerRenameCommand(),
        new TTSVoiceServerSampleCommand(),
      ],
    });
  }
}
