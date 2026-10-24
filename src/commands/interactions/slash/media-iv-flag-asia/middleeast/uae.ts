import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'uae';

export class MediaIVFlagUAECommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a UAE flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.uae.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagUAE.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.uae.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagUAE.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagUAE.createMessage(context, args);
  }
}
