import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'zoom-blur';

export class MediaIVZoomBlurCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Zoom Blur to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationZoomBlur.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Zoom Amount (Default: 1.2)', type: 'number'},
        {name: 'expand', description: 'Expand back to Original Size', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationZoomBlur.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationZoomBlur.createMessage(context, args);
  }
}
