import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'starman';

export class MediaIVOverlayStarmanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay Elon Musk\'s Starman over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.starman.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayStarman.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.starman.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayStarman.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayStarman.createMessage(context, args);
  }
}
