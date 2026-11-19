import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'contrast-multiply';

export class MediaIVAdjustContrastMultiplyCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Multiply an image or video\'s contrast, keeping its colors';
  descriptionLocalizations = I18n.localizations('commands.media_iv_adjust.contrast_multiply.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationContrastMultiply.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_adjust.contrast_multiply.name');

  constructor() {
    super({
      options: [
        {
          name: 'multiplier',
          description: '1 is unchanged, 0 is gray, negatives invert, -100 to 100 (Default: 1.5)',
          ...I18n.optionLocalizations('commands.media_iv_adjust.contrast_multiply.multiplier'),
          maxValue: 100,
          minValue: -100,
          type: 'number',
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationContrastMultiply.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationContrastMultiply.createMessage(context, args);
  }
}
