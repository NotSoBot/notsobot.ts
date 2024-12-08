import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'zoom';

export class MediaIVZoomCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Zoom into an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationZoom.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'amount', description: 'Zoom Amount (Default: 1.2)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationZoom.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationZoom.createMessage(context, args);
  }
}
