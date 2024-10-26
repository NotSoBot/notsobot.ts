import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'waves';

export class MediaIVWavesCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Distort an Image or Video with a sine wave function that moves';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWaveAnimated.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'amplitude', description: 'Amplitude Amount (Pixels that will be displaced Up or Down) (Default: 10)', type: Number},
        {name: 'length', description: 'Wave Length of the sine function (Default: 64)', label: 'waveLength', type: Number},
        {name: 'speed', description: 'Wave Speed (Default: 1)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWaveAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWaveAnimated.createMessage(context, args);
  }
}
