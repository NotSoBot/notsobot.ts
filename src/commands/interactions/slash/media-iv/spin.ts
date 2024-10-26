import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'spin';

export class MediaIVSpinCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Create a Spinning Disk from an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSpin.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'counterclockwise', description: 'Rotate the Media counter-clockwise', type: Boolean},
        {name: 'nocircle', description: 'Do not turn the Media into a Circle', type: Boolean},
        {name: 'nocrop', description: 'Do not Crop', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSpin.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSpin.createMessage(context, args);
  }
}
