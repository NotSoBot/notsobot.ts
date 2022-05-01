import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'paper';

export class ImagePaperCommand extends BaseInteractionImageCommandOption {
  description = 'Create a Paper out of an Image/Gif';
  metadata = {
    id: Formatter.Commands.ImageManipulationPaper.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageManipulationPaper.CommandArgs) {
    return Formatter.Commands.ImageManipulationPaper.createMessage(context, args);
  }
}
