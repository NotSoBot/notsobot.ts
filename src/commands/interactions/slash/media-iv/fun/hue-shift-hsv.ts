import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'hue-shift-hsv';

export class MediaIVHueShiftHSVCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shift the Image or Video\'s Hue, Saturation, and Brightness by X amount';
  metadata = {
	id: Formatter.Commands.MediaIVManipulationHueShiftHSV.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
	super({
	  options: [
		{name: 'hue', description: 'Hue Shift Amount (0..360)', type: Number},
		{name: 'saturation', description: 'Saturation Shift Amount', type: Number},
		{name: 'brightness', description: 'Brightness Shift Amount', type: Number},
	  ],
	});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHueShiftHSV.CommandArgs) {
	return Formatter.Commands.MediaIVManipulationHueShiftHSV.createMessage(context, args);
  }
}
