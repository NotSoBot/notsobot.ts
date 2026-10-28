import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'hue-shift-rgb';

export class MediaIVHueShiftRGBCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shift an Image or Video\'s RGB Pixel Color by X amount';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.hue_shift_rgb.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationHueShiftRGB.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'red', description: 'Red Hue Shift Amount', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_rgb.red'), type: Number},
        {name: 'green', description: 'Green Hue Shift Amount', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_rgb.green'), type: Number},
        {name: 'blue', description: 'Blue Hue Shift Amount', ...I18n.optionLocalizations('commands.media_iv_2.fun.hue_shift_rgb.blue'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationHueShiftRGB.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueShiftRGB.createMessage(context, args);
  }
}
