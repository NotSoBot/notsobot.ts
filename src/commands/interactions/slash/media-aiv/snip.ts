import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'snip';

export class MediaAIVSnipCommand extends BaseInteractionMediaCommandOption {
  description = 'Snip an Animated Image/Audio/Video';
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationSnip.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'start', description: 'Timestamp to start at', default: 0, value: Parameters.secondsWithOptions({negatives: true})},
        {name: 'end', description: 'Timestamp to end at', default: 0, value: Parameters.secondsWithOptions({negatives: true})},
        {name: 'audio', description: 'Audio Only', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationSnip.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationSnip.createMessage(context, args);
  }
}
