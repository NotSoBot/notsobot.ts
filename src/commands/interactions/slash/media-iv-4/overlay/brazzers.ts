import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'brazzers';

export class MediaIVOverlayBrazzersCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay the Brazzers logo on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.brazzers.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayBrazzers.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.brazzers.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayBrazzers.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayBrazzers.createMessage(context, args);
  }
}
