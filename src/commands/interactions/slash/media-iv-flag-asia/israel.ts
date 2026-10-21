import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'israel';

export class MediaIVOverlayIsraelCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Israeli flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.israel.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagIsrael.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.israel.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagIsrael.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagIsrael.createMessage(context, args);
  }
}
