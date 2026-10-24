import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export class TTSVoiceCreateCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Clone a voice from an Audio or Video File';
  metadata = {
    id: Formatter.Commands.VoiceClone.COMMAND_ID,
    premiumPlus: true,
  };
  name = 'create';

  constructor() {
    super({
      options: [
        {name: 'name', description: 'Name for the voice', maxLength: 128},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.VoiceClone.CommandArgs) {
    return Formatter.Commands.VoiceClone.createMessage(context, args);
  }
}
