import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'hue-shift-yiq';

export class MediaIVHueShiftYIQCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Rotate the Image or Video\'s Hue in YIQ (NTSC) color space, keeping its brightness';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.hue_shift_yiq.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationHueShiftYIQ.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'hue', description: 'Hue Shift Amount (-360..360)', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_yiq.hue'), type: Number, minValue: -360, maxValue: 360},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHueShiftYIQ.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueShiftYIQ.createMessage(context, args);
  }
}
