import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'hue-shift-rgb';

export class MediaIVHueShiftRGBCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shift the Image or Video\'s RGB Pixel Color by X amount';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationHueShiftRGB.COMMAND_ID,
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

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHueShiftRGB.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueShiftRGB.createMessage(context, args);
  }
}
