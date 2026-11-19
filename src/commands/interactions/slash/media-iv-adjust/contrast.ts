import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'contrast';

export class MediaIVAdjustContrastCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Raise or lower an image or video\'s contrast';
  descriptionLocalizations = I18n.localizations('commands.media_iv_adjust.contrast.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationContrast.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_adjust.contrast.name');

  constructor() {
    super({
      options: [
        {
          name: 'amount',
          description: '-100 (flat gray) to 100 (black and white) (Default: 30)',
          ...I18n.optionLocalizations('commands.media_iv_adjust.contrast.amount'),
          maxValue: 100,
          minValue: -100,
          type: 'number',
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationContrast.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationContrast.createMessage(context, args);
  }
}
