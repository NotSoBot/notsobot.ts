import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'paper';

export class MediaIVPaperCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Image or Video on some paper';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationPaper.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPaper.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPaper.createMessage(context, args);
  }
}
