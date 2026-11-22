import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'above-head';

export class MediaIVOverlayAboveHeadCommand extends BaseInteractionMediasCommandOption {
  description = 'Put an image above people\'s heads in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.above_head.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceAbove.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.above_head.name');

  constructor() {
    super({
      options: [
        {
          name: 'faces',
          description: 'drawfaces numbers of the heads it goes above, like 1,0 (Default: every head)',
          ...I18n.optionLocalizations('commands.media_iv.overlay.above_head.faces'),
          value: Parameters.numbers({max: 99, maxAmount: Formatter.Commands.MediaIVManipulationFaceAbove.MAX_FACES, min: 0}),
        },
        {
          name: 'size',
          description: 'The image\'s size in heads, 0.25 to 3 (Default: 1)',
          ...I18n.optionLocalizations('commands.media_iv.overlay.above_head.size'),
          maxValue: 3,
          minValue: 0.25,
          type: 'number',
        },
      ],
      maxAmount: 2,
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceAbove.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceAbove.createMessage(context, args);
  }
}
