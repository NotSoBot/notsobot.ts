import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'fade-in';

export class MediaAIVFadeInCommand extends BaseInteractionMediaCommandOption {
  description = 'Add a Fade In Animation to an Audio/Image/Video file';
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationFadeIn.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'color', description: 'Color to Use'},
        {name: 'duration', description: 'Fade In Duration', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationFadeIn.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationFadeIn.createMessage(context, args);
  }
}
