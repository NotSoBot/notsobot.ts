import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'uncaption';

export class MediaIVToolsUncaptionCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Uncaption an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationUncaption.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationUncaption.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationUncaption.createMessage(context, args);
  }
}
