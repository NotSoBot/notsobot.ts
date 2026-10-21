import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'pinch-punch';

export class MediaIVPinchPunchCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Pinch an Image or Video in or punch it out around a point, like VEGAS\' Pinch/Punch';
  descriptionLocalizations = I18n.localizations('commands.media_iv_5.fun.pinch_punch.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationPinchPunch.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_5.fun.pinch_punch.name');

  constructor() {
    super({
      options: [
        {name: 'intensity', description: 'Positive punches out, negative pinches in (-1..1) (Default: 0.5)', ...I18n.optionLocalizations('commands.media_iv_5.fun.pinch_punch.intensity'), type: Number},
        {name: 'x', description: 'Center across, 0.5 is the middle (-1..2) (Default: 0.5)', ...I18n.optionLocalizations('commands.media_iv_5.fun.pinch_punch.x'), type: Number},
        {name: 'y', description: 'Center down, 0.5 is the middle (-1..2) (Default: 0.5)', ...I18n.optionLocalizations('commands.media_iv_5.fun.pinch_punch.y'), type: Number},
        {name: 'x-scale', description: 'Width of the area, of half the width (0.01..4) (Default: 1)', ...I18n.optionLocalizations('commands.media_iv_5.fun.pinch_punch.x_scale'), label: 'xScale', type: Number},
        {name: 'y-scale', description: 'Height of the area, of half the height (0.01..4) (Default: 1)', ...I18n.optionLocalizations('commands.media_iv_5.fun.pinch_punch.y_scale'), label: 'yScale', type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPinchPunch.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPinchPunch.createMessage(context, args);
  }
}
