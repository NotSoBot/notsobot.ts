import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'globe';

export class MediaIVGlobeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Create a Globe out of an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGlobe.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'tiled', description: 'Make a Tiled Globe', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGlobe.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGlobe.createMessage(context, args);
  }
}
