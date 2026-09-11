import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'reverse';

export class MediaAIVReverseCommand extends BaseInteractionMediaCommandOption {
  description = 'Reverse an Animated Image/Audio/Video';
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationReverse.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'noaudio', description: 'Do not reverse audio', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationReverse.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationReverse.createMessage(context, args);
  }
}
