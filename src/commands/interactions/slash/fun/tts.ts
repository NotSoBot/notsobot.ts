import { Interaction } from 'detritus-client';

import { TTSVoices } from '../../../../constants';
import { Formatter, Parameters, toTitleCase } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';



export interface CommandArgs {
  text: string,
  use?: string,
}

export const COMMAND_NAME = 'tts';

export class TTSCommand extends BaseInteractionCommandOption {
  description = 'Generate Text to Speech';
  metadata = {
    id: Formatter.Commands.FunTTS.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'text', description: 'Text Here', required: true},
        {
          name: 'use',
          description: 'Speech Voice',
          onAutoComplete: Parameters.AutoComplete.ttsVoices,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const realArgs: Formatter.Commands.FunTTS.CommandArgs = {text: args.text};
    if (args.use) {
      const [ voice, voiceId ] = args.use.split('.');
      if (voice) {
        realArgs.use = {voice: voice as TTSVoices, voiceId};
      }
    }
    return Formatter.Commands.FunTTS.createMessage(context, realArgs);
  }
}
