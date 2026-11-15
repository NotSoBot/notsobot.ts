import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'hue-shift-hsv-ffmpeg';

export class MediaIVHueShiftHSVFFMPEGCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Turn an Image or Video\'s Hue with FFmpeg\'s hue filter, keeping its Brightness (not HSV)';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.hue_shift_hsv_ffmpeg.description');
  metadata = {
  id: Formatter.Commands.MediaIVManipulationHueShiftHSVFFMPEG.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
  super({
    options: [
    {name: 'hue', description: 'Hue Shift Amount (-360..360)', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_hsv_ffmpeg.hue'), type: Number},
    {name: 'saturation', description: 'Saturation Multiplier, below 0 flips the colors (-10..10)', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_hsv_ffmpeg.saturation'), type: 'number'},
    {name: 'brightness', description: 'Brightness Added, 10 is about white (-10..10)', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_hsv_ffmpeg.brightness'), type: 'number'},
    ],
  });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHueShiftHSVFFMPEG.CommandArgs) {
  return Formatter.Commands.MediaIVManipulationHueShiftHSVFFMPEG.createMessage(context, args);
  }
}
