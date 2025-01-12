import { Interaction } from 'detritus-client';

import { MediaSlideDirections } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'slide';

export class MediaIVSlideCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Sliding Effect to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSlide.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'direction', description: 'Slide Direction', choices: Parameters.Slash.oneOf({choices: MediaSlideDirections, defaultChoice: MediaSlideDirections.RIGHT})},
        {name: 'speed', description: 'Slide Speed (Default: 1.0)', type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSlide.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSlide.createMessage(context, args);
  }
}
