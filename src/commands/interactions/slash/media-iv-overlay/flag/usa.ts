import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'usa';

export class MediaIVOverlayUSACommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a USA flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.usa.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagUSA.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.usa.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagUSA.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagUSA.createMessage(context, args);
  }
}
