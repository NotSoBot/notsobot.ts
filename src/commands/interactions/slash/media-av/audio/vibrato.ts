import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'vibrato';

export class MediaAVAudioVibratoCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Adjust the timing of sound waves in any Audio or Video file';
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioVibrato.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'frequency', description: 'Modulation Frequency (Default: 5.0)', type: 'number'},
        {name: 'depth', description: 'Depth of Modulation (Default: 0.5)', type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioVibrato.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioVibrato.createMessage(context, args);
  }
}
