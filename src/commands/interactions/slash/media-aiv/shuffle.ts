import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'shuffle';

export class MediaAIVShuffleCommand extends BaseInteractionMediaCommandOption {
  description = 'Shuffle an Audio/Image/Video file\'s frames around randomly';
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationShuffle.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'segment', description: 'Each Segment Duration (Default: 0.5)', type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationShuffle.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationShuffle.createMessage(context, args);
  }
}
