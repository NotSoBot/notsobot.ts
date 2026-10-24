import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'cambodia';

export class MediaIVFlagCambodiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Cambodian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.cambodia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagCambodia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.cambodia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagCambodia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCambodia.createMessage(context, args);
  }
}
