import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'hue-shift';

export class MediaIVHueShiftCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shift the Image or Video\'s Pixel Color by X amount';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationHueShift.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'red', description: 'Red Hue Shift Amount', type: Number},
        {name: 'green', description: 'Green Hue Shift Amount', type: Number},
        {name: 'blue', description: 'Blue Hue Shift Amount', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHueShift.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueShift.createMessage(context, args);
  }
}
