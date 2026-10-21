import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'hue-shift-hsv';

export class MediaIVHueShiftHSVCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shift the Image or Video\'s Hue, Saturation, and Brightness by X amount using ImageMagick';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.hue_shift_hsv.description');
  metadata = {
	id: Formatter.Commands.MediaIVManipulationHueShiftHSV.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
	super({
	  options: [
		{name: 'hue', description: 'Hue Shift Amount (0..360)', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_hsv.hue'), type: Number},
		{name: 'saturation', description: 'Saturation Shift Amount', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_hsv.saturation'), type: Number},
		{name: 'brightness', description: 'Brightness Shift Amount', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_hsv.brightness'), type: Number},
	  ],
	});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHueShiftHSV.CommandArgs) {
	return Formatter.Commands.MediaIVManipulationHueShiftHSV.createMessage(context, args);
  }
}
