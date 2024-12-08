import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'delay';

export class MediaAVAudioDelayCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Delay the Audio Stream of an Audio or Video File';
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioDelay.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'delay', description: 'Delay Amount', required: true, type: Number},
        {name: 'nosnip', description: 'Avoid Snipping Excess Audio', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioDelay.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioDelay.createMessage(context, args);
  }
}
