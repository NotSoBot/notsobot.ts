import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'invert-rgba';

export class MediaIVInvertRGBACommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Invert each individual channel with 1, or ignore with 0';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationInvertRGBA.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'red', description: 'Invert Red Channel', type: Number},
        {name: 'green', description: 'Invert Green Channel', type: Number},
        {name: 'blue', description: 'Invert Blue Channel', type: Number},
        {name: 'alpha', description: 'Invert Alpha Channel', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationInvertRGBA.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationInvertRGBA.createMessage(context, args);
  }
}
