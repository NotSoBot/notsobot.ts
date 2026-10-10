import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'triggered';

export class MediaIVTriggeredCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shake an Image or Video and attach a Triggered Label';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationShakeTriggered.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationShakeTriggered.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationShakeTriggered.createMessage(context, args);
  }
}
