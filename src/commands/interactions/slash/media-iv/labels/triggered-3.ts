import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'triggered-3';

export class MediaIVLabelsTriggered3Command extends BaseInteractionImageOrVideoCommandOption {
  description = 'Resize an Image or Video to 256px wide and attach a Triggered Label (Style 3)';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationLabelsTriggered3.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationLabelsTriggered3.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationLabelsTriggered3.createMessage(context, args);
  }
}
