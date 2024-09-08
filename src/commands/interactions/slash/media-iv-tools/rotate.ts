import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'rotate';

export class MediaIVToolsRotateCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Rotate an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVToolsRotate.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'crop', description: 'Crop Media', type: Boolean},
        {name: 'degrees', description: 'Resize Amount (default: 90)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsRotate.CommandArgs) {
    return Formatter.Commands.MediaIVToolsRotate.createMessage(context, args);
  }
}
