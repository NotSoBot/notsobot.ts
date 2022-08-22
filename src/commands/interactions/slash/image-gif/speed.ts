import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'speed';

export class ImageGifSpeedCommand extends BaseInteractionImageCommandOption {
  description = 'Edit an Animated Image\'s Speed';
  metadata = {
    id: Formatter.Commands.ImageGifSpeed.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'speed', description: 'milliseconds'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageGifSpeed.CommandArgs) {
    return Formatter.Commands.ImageGifSpeed.createMessage(context, args);
  }
}
