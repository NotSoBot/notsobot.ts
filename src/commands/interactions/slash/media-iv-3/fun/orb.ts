import { Interaction } from 'detritus-client';

import { MediaSlideDirections } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'orb';

export class MediaIVOrbCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Create a spinning Globe/Orb out of an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOrb.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'direction',
          description: 'Rotation Direction',
          choices: Parameters.Slash.oneOf({choices: MediaSlideDirections, defaultChoice: MediaSlideDirections.RIGHT}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOrb.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOrb.createMessage(context, args);
  }
}
