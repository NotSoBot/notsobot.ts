import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'brightness';

export class MediaIVAdjustBrightnessCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Brighten an image or video, negative numbers darken it';
  descriptionLocalizations = I18n.localizations('commands.media_iv_adjust.brightness.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationBrightness.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_adjust.brightness.name');

  constructor() {
    super({
      options: [
        {
          name: 'percentage',
          description: '-100 (black) to 100 (white) (Default: 25)',
          ...I18n.optionLocalizations('commands.media_iv_adjust.brightness.percentage'),
          maxValue: 100,
          minValue: -100,
          type: 'number',
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationBrightness.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationBrightness.createMessage(context, args);
  }
}
