import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'jpeg';

export class ImageJPEGCommand extends BaseInteractionImageCommandOption {
  description = 'Needs More JPEG';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationJPEG.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'quality', description: 'JPEG Quality', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationJPEG.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationJPEG.createMessage(context, args);
  }
}
