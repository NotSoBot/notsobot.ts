import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export class TTSVoiceSampleCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Add another Audio or Video File to one of your cloned voices';
  metadata = {
    id: Formatter.Commands.VoiceCloneAdd.COMMAND_ID,
    premiumPlus: true,
  };
  name = 'sample';

  constructor() {
    super({
      options: [
        {name: 'voice', description: 'Your cloned voice', required: true, onAutoComplete: Parameters.AutoComplete.clonedVoices},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VoiceCloneAdd.CommandArgs) {
    return Formatter.Commands.VoiceCloneAdd.createMessage(context, args);
  }
}
