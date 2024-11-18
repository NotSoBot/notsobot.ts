import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'hue-shift-hsv-ffmpeg';

export class MediaIVHueShiftHSVFFMPEGCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shift the Image or Video\'s Hue, Saturation, and Brightness by X amount using FFMPEG';
  metadata = {
  id: Formatter.Commands.MediaIVManipulationHueShiftHSV.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
  super({
    options: [
    {name: 'hue', description: 'Hue Shift Amount (-360..360)', type: Number},
    {name: 'saturation', description: 'Saturation Shift Amount (0..3)', type: Number},
    {name: 'brightness', description: 'Brightness Shift Amount (-1..1)', type: Number},
    ],
  });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHueShiftHSV.CommandArgs) {
  return Formatter.Commands.MediaIVManipulationHueShiftHSV.createMessage(context, args);
  }
}
