import { Interaction } from 'detritus-client';

import { MediaEdgeDetectMethods } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'edge-detect';

export class MediaIVEdgeDetectCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Extract and compose Image/Video edges using 8-directional Sobel edge detection';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEdgeDetect.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'invert', description: 'Invert Edges', type: Boolean},
        {
          name: 'method',
          description: 'Compose Method',
          choices: Parameters.Slash.oneOf({choices: MediaEdgeDetectMethods, defaultChoice: MediaEdgeDetectMethods.OVER}),
        },
        {name: 'strength', description: 'Contrast Strength (0..50) (Default: 5.0)', type: 'number'},
        {name: 'mix', description: 'Mixing Percentage (0..100) (Default: 100)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEdgeDetect.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEdgeDetect.createMessage(context, args);
  }
}
