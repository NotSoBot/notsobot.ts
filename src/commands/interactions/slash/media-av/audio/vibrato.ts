import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'vibrato';

export class MediaAVAudioVibratoCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Vibrate an Audio or Video\'s Pitch';
  metadata = {
  id: Formatter.Commands.MediaAVManipulationAudioVibrato.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'frequency', description: 'Modulation Frequency (Default: 5.0)'},
        {name: 'depth', description: 'Depth of Modulation (Default: 0.5)'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioVibrato.CommandArgs) {
  return Formatter.Commands.MediaAVManipulationAudioVibrato.createMessage(context, args);
  }
}
