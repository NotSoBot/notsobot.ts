import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'adhd';

export class MediaAIVADHDCommand extends BaseInteractionMediaCommandOption {
  description = 'Add random gameplay to an Audio/Image/Video file';
  metadata = {
	id: Formatter.Commands.MediaAIVManipulationADHD.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'horizontal', description: 'Video should be put Horizontally', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationADHD.CommandArgs) {
	return Formatter.Commands.MediaAIVManipulationADHD.createMessage(context, args);
  }
}
