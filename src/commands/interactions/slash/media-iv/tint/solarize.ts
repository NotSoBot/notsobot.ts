import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'solarize';

export class MediaIVSolarizeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Solarize Effect to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSolarize.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSolarize.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSolarize.createMessage(context, args);
  }
}
