import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'shake';

export class MediaIVShakeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shake an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationShake.COMMAND_ID,
  };
  name = COMMAND_NAME;
  
  constructor() {
    super({
      options: [
        {name: 'horizontal', description: 'Horizontal Magnitude', type: Number},
        {name: 'randomize', description: 'Randomize the Shake Magnitude', type: Boolean},
        {name: 'vertical', description: 'Vertical Magnitude', type: Number},
      ],
    });
  }
  
  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationShake.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationShake.createMessage(context, args);
  }
}
