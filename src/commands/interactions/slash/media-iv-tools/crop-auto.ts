import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop-auto';

export class MediaIVToolsCropAutoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Crop an Image or Video automatically';
  metadata = {
    id: Formatter.Commands.MediaIVToolsCropAuto.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsCropAuto.CommandArgs) {
    return Formatter.Commands.MediaIVToolsCropAuto.createMessage(context, args);
  }
}
