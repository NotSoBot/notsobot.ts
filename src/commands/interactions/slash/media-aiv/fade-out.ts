import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'fade-out';

export class MediaAIVFadeOutCommand extends BaseInteractionMediaCommandOption {
  description = 'Add a Fade Out Animation to an Audio/Image/Video file';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.fade_out.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationFadeOut.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.fade_out.name');

  constructor() {
    super({
      options: [
        {name: 'duration', description: 'Fade Duration (Default: 0.5)', ...I18n.optionLocalizations('commands.media_aiv.fade_out.duration'), type: 'number'},
        {name: 'color', description: 'Color to Use', ...I18n.optionLocalizations('commands.media_aiv.fade_out.color')},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationFadeOut.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationFadeOut.createMessage(context, args);
  }
}
