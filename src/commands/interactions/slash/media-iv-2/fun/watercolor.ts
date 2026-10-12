import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'watercolor';

export class MediaIVWatercolorCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Watercolor Effect to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.watercolor.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationWatercolor.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.watercolor.name');

  constructor() {
    super({
      options: [
        {name: 'contrast', description: 'Contrast (Default: 0.0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.watercolor.contrast'), type: 'number'},
        {name: 'edge', description: 'Edge Gain (Default: 2.0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.watercolor.edge'), type: 'number'},
        {name: 'mixing', description: 'Edge Mixing (Default: 33)', ...I18n.optionLocalizations('commands.media_iv_2.fun.watercolor.mixing'), type: Number},
        {name: 'smoothing', description: 'Texture Smoothing (Default: 0)', ...I18n.optionLocalizations('commands.media_iv_2.fun.watercolor.smoothing'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationWatercolor.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWatercolor.createMessage(context, args);
  }
}
