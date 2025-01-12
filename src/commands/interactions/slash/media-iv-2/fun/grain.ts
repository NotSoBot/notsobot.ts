import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'grain';

export class MediaIVGrainCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Film Grain effect to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGrain.COMMAND_ID,
  };
  name = COMMAND_NAME;
  
  constructor() {
    super({
      options: [
        {name: 'strength', description: 'Film Grain Strength (0..100) (Default: 20)', type: Number},
        {name: 'flags', description: 'FFMPEG Noise Flags (choices: aptu) (Default: at)'},
      ],
    });
  }
  
  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGrain.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGrain.createMessage(context, args);
  }
}
