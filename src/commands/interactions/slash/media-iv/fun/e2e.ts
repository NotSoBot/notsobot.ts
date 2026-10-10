import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'e2e';

export class MediaIVE2ECommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Edges to Emoji an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationEdges2Emoji.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationEdges2Emoji.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationEdges2Emoji.createMessage(context, args);
  }
}
