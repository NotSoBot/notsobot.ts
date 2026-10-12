import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'hue-shift-hsv-ffmpeg';

export class MediaIVHueShiftHSVFFMPEGCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shift the Image or Video\'s Hue, Saturation, and Brightness by X amount using FFMPEG';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.hue_shift_hsv_ffmpeg.description');
  metadata = {
  id: Formatter.Commands.MediaIVManipulationHueShiftHSV.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
  super({
    options: [
    {name: 'hue', description: 'Hue Shift Amount (-360..360)', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_hsv_ffmpeg.hue'), type: Number},
    {name: 'saturation', description: 'Saturation Shift Amount (0..3)', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_hsv_ffmpeg.saturation'), type: Number},
    {name: 'brightness', description: 'Brightness Shift Amount (-1..1)', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_hsv_ffmpeg.brightness'), type: Number},
    ],
  });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHueShiftHSV.CommandArgs) {
  return Formatter.Commands.MediaIVManipulationHueShiftHSV.createMessage(context, args);
  }
}
