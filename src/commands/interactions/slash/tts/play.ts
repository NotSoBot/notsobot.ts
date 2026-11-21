import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { TTSVoices } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';



export interface CommandArgs {
  queue?: boolean,
  text: string,
  use?: string,
}

export const COMMAND_NAME = 'play';

// servers only: outside of one it says to join a voice channel. Said right away over the music, or queued like a song
// (`queue`, or when we aren't in their channel yet)
export class TTSPlayCommand extends BaseInteractionCommandOption {
  description = 'Say Text to Speech in your voice channel, over the music';
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
        {
          name: 'queue',
          description: 'Queue it like a song instead of saying it over the music',
          ...I18n.optionLocalizations('commands.fun.tts.queue'),
          type: ApplicationCommandOptionTypes.BOOLEAN,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const realArgs: Formatter.Commands.MusicTTS.CommandArgs = {queue: args.queue, text: args.text};
    if (args.use) {
      const [ voice, voiceId ] = args.use.split('.');
      if (voice) {
        realArgs.use = {voice: voice as TTSVoices, voiceId};
      }
    }
    return Formatter.Commands.MusicTTS.createMessage(context, realArgs);
  }
}
