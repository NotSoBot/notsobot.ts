import { Interaction } from 'detritus-client';

import { TTSVoices } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';



export interface CommandArgs {
  text: string,
  use?: string,
}

export const COMMAND_NAME = 'play';

// like `music play`, servers only: outside of one it says to join a voice channel
export class TTSPlayCommand extends BaseInteractionCommandOption {
  description = 'Say Text to Speech in your voice channel (queued like a song)';
  metadata = {
    id: Formatter.Commands.MusicTTS.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text Here',
          ...I18n.optionLocalizations('commands.fun.tts.text'),
          value: Parameters.parsedMentionsText,
          required: true,
        },
        {
          name: 'use',
          description: 'Speech Voice',
          ...I18n.optionLocalizations('commands.fun.tts.use'),
          onAutoComplete: Parameters.AutoComplete.ttsVoices,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const realArgs: Formatter.Commands.MusicTTS.CommandArgs = {text: args.text};
    if (args.use) {
      const [ voice, voiceId ] = args.use.split('.');
      if (voice) {
        realArgs.use = {voice: voice as TTSVoices, voiceId};
      }
    }
    return Formatter.Commands.MusicTTS.createMessage(context, realArgs);
  }
}
