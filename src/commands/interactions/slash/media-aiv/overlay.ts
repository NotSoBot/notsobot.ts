import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'overlay';

export class MediaAIVOverlayCommand extends BaseInteractionMediasCommandOption {
  description = 'Overlay one media on top of another';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.overlay.description');
  metadata = {
    id: Formatter.Commands.MediaAIVManipulationOverlay.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.overlay.name');

  constructor() {
    super({
      options: [
        {name: 'blend', description: 'Similarity Blend Amount', ...I18n.optionLocalizations('commands.media_aiv.overlay.blend')},
        {name: 'color', description: 'Color to make transparent', ...I18n.optionLocalizations('commands.media_aiv.overlay.color')},
        {name: 'noloop', description: 'Do not loop the shortest media to match the longest media timestamp', ...I18n.optionLocalizations('commands.media_aiv.overlay.noloop'), type: Boolean},
        {name: 'opacity', description: 'Opacity of the overlay', ...I18n.optionLocalizations('commands.media_aiv.overlay.opacity'), type: Number},
        {name: 'resize', description: 'Resize Equation (ex: "fit(mw, mh)")', ...I18n.optionLocalizations('commands.media_aiv.overlay.resize')},
        {name: 'similarity', description: 'Color similarity percentage to make transparent', ...I18n.optionLocalizations('commands.media_aiv.overlay.similarity')},
        {name: 'x', description: 'X Position Equation (ex: "(mw/2)-(ow/2)")', ...I18n.optionLocalizations('commands.media_aiv.overlay.x')},
        {name: 'y', description: 'Y Position Equation (ex: "(mh/2)-(oh/2)")', ...I18n.optionLocalizations('commands.media_aiv.overlay.y')},
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVManipulationOverlay.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationOverlay.createMessage(context, args);
  }
}
