import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'fade-out';

export class MediaAIVFadeOutCommand extends BaseInteractionMediaCommandOption {
  description = 'Add a Fade Out Animation to an Audio/Image/Video file';
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationFadeOut.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'color', description: 'Color to Use'},
        {name: 'duration', description: 'Fade Out Duration', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationFadeOut.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationFadeOut.createMessage(context, args);
  }
}