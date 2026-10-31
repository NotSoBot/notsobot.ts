import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'fade-overlay';

export class MediaAIVFadeOverlayCommand extends BaseInteractionMediasCommandOption {
  description = 'Slowly fade a media in on top of another, until it covers it';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.fade_overlay.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationFadeOverlay.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.fade_overlay.name');

  constructor() {
    super({
      options: [
        {name: 'duration', description: 'Seconds the fade takes (Default: until the end)', ...I18n.optionLocalizations('commands.media_aiv.fade_overlay.duration'), type: 'number'},
        {name: 'start', description: 'Seconds in when the fade starts (Default: 0)', ...I18n.optionLocalizations('commands.media_aiv.fade_overlay.start'), type: 'number'},
        {name: 'noloop', description: 'Do not loop the shortest media to match the longest media timestamp', ...I18n.optionLocalizations('commands.media_aiv.fade_overlay.noloop'), type: Boolean},
        {name: 'resize', description: 'Resize Equation (Default: cover)', ...I18n.optionLocalizations('commands.media_aiv.fade_overlay.resize')},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationFadeOverlay.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationFadeOverlay.createMessage(context, args);
  }
}
