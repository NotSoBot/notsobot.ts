import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'repeat';

export class MediaAIVRepeatCommand extends BaseInteractionMediaCommandOption {
  description = 'Play a media some times in a row';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.repeat.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationRepeat.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.repeat.name');

  constructor() {
    super({
      options: [
        {
          name: 'amount',
          description: 'Times in a row, 2 to 100 (Default: 2)',
          ...I18n.optionLocalizations('commands.media_aiv.repeat.amount'),
          maxValue: 100,
          minValue: 2,
          type: Number,
        },
        {
          name: 'duration',
          description: 'Repeat it until this many seconds instead',
          ...I18n.optionLocalizations('commands.media_aiv.repeat.duration'),
          maxValue: 600,
          minValue: 0.1,
          type: 'number',
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationRepeat.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationRepeat.createMessage(context, args);
  }
}
