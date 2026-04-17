import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'stretch';

export class MediaIVStretchCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Stretch an Image or Video by its Width or Height';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationStretch.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'width', description: 'Width Amount', type: 'float'},
        {name: 'height', description: 'Height Amount', type: 'float'},
        {name: 'crop', description: 'Crop excess width/height', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationStretch.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationStretch.createMessage(context, args);
  }
}
