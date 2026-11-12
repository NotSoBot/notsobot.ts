import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';
import { FACE_OPTION } from '../media-iv-face/options';


export const COMMAND_NAME = 'cutout';

export class MediaIVEyesCutoutCommand extends BaseInteractionMediasCommandOption {
  description = 'Cut out people\'s eyes and mouth and paste them back bigger, over a second media or a color';
  descriptionLocalizations = I18n.localizations('commands.media_iv_4.eyes.cutout.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceCutout.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_4.eyes.cutout.name');

  constructor() {
    super({
      options: [
        {
          name: 'color',
          description: 'Color covering the face behind them when there\'s no second media',
          ...I18n.optionLocalizations('commands.media_iv_4.eyes.cutout.color'),
        },
        {
          name: 'size',
          description: 'How much bigger they get, 1 to 3 (Default: 1.8)',
          ...I18n.optionLocalizations('commands.media_iv_4.eyes.cutout.size'),
          maxValue: 3,
          minValue: 1,
          type: Number,
        },
        FACE_OPTION,
      ],
      maxAmount: 2,
      minAmount: 1,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceCutout.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceCutout.createMessage(context, args);
  }
}
