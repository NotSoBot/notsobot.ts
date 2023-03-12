import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'speed';

export class ImageGifSpeedCommand extends BaseInteractionImageCommandOption {
  description = 'Edit an Animated Image\'s Speed';
  metadata = {
    id: Formatter.Commands.MediaIVToolsFramesSpeed.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'speed', description: 'Number to double the gif speed by, floats included'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsFramesSpeed.CommandArgs) {
    return Formatter.Commands.MediaIVToolsFramesSpeed.createMessage(context, args);
  }
}
