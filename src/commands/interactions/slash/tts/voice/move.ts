import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TTSVoiceMoveCommand extends BaseInteractionCommandOption {
  description = 'Move one of your cloned voices between ZONOS3 and fish.audio';
  metadata = {
    id: Formatter.Commands.VoiceMove.COMMAND_ID,
  };
  name = 'move';

  constructor() {
    super({
      options: [
        {name: 'voice', description: 'Your cloned voice', required: true, onAutoComplete: Parameters.AutoComplete.clonedVoices},
        {name: 'platform', description: 'Where it goes, the other one by default', choices: Formatter.Commands.VoiceList.VOICE_CLONE_PLATFORM_CHOICES},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VoiceMove.CommandArgs) {
    return Formatter.Commands.VoiceMove.createMessage(context, args);
  }
}
