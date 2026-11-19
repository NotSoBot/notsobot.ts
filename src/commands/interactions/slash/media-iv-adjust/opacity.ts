import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'opacity';

export class MediaIVAdjustOpacityCommand extends BaseInteractionImageCommandOption {
  description = 'Make an image see-through';
  descriptionLocalizations = I18n.localizations('commands.media_iv_adjust.opacity.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOpacity.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_adjust.opacity.name');

  constructor() {
    super({
      options: [
        {
          name: 'percentage',
          description: 'How visible it stays, 0 (invisible) to 100 (Default: 50)',
          ...I18n.optionLocalizations('commands.media_iv_adjust.opacity.percentage'),
          maxValue: 100,
          minValue: 0,
          type: 'number',
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOpacity.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOpacity.createMessage(context, args);
  }
}
