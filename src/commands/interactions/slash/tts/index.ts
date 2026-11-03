import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { TTSSpeakCommand } from './speak';
import { TTSVoiceGroupCommand } from './voice';
import { TTSVoiceServerGroupCommand } from './voice-server';


// a slash command with subcommands can't be used by itself, so text to speech is `/tts speak`
export default class TTSCommand extends BaseSlashCommand {
  description = 'Text-to-Speech, your cloned voices and the server\'s';
  name = 'tts';

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new TTSSpeakCommand(),
        new TTSVoiceGroupCommand(),
        new TTSVoiceServerGroupCommand(),
      ],
    });
  }
}
