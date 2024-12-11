import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'swirl';

export class MediaIVSwirlCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Swirl an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSwirl.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'degrees', description: 'Swirl Degrees (-360..360)', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSwirl.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSwirl.createMessage(context, args);
  }
}
