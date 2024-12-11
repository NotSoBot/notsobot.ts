import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'motion-blur';

export class MediaIVMotionBlurCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Motion Blur to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMotionBlur.COMMAND_ID,
  };
  name = COMMAND_NAME;
  
  constructor() {
    super({
      options: [
        {name: 'strength', description: 'Blur Strength Amount (1..50) (Default: 20)', type: Number},
        {name: 'vertical', description: 'Vertical Blur', type: Boolean},
      ],
    });
  }
  
  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMotionBlur.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMotionBlur.createMessage(context, args);
  }
}
