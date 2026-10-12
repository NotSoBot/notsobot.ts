import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'fade-in';

export class MediaAIVFadeInCommand extends BaseInteractionMediaCommandOption {
  description = 'Add a Fade In Animation to an Audio/Image/Video file';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.fade_in.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationFadeIn.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.fade_in.name');

  constructor() {
    super({
      options: [
        {name: 'duration', description: 'Fade Duration (Default: 0.5)', ...I18n.optionLocalizations('commands.media_aiv.fade_in.duration'), type: 'number'},
        {name: 'color', description: 'Color to Use', ...I18n.optionLocalizations('commands.media_aiv.fade_in.color')},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationFadeIn.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationFadeIn.createMessage(context, args);
  }
}
