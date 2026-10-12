import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'speed';

export class MediaAIVSpeedCommand extends BaseInteractionMediaCommandOption {
  description = 'Edit an Animated Image/Audio/Video\'s Speed';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.speed.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationSpeed.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.speed.name');

  constructor() {
    super({
      options: [
        {name: 'speed', description: 'Number to double the speed by, floats included', ...I18n.optionLocalizations('commands.media_aiv.speed.speed'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationSpeed.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationSpeed.createMessage(context, args);
  }
}
