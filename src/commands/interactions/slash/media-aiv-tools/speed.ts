import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'speed';

export class MediaAIVToolsSpeedCommand extends BaseInteractionImageCommandOption {
  description = 'Edit an Animated Image/Audio/Video\'s Speed';
  metadata = {
    id: Formatter.Commands.MediaAIVToolsSpeed.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'speed', description: 'Number to double the speed by, floats included'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVToolsSpeed.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsSpeed.createMessage(context, args);
  }
}
