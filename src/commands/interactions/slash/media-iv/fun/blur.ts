import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'blur';

export class MediaIVBlurCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Blur an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationBlur.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'scale', description: 'Blur Scale (Default: 2.0)', type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationBlur.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationBlur.createMessage(context, args);
  }
}
