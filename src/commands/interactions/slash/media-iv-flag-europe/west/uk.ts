import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'uk';

export class MediaIVOverlayUKCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a UK flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.uk.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagUK.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.uk.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagUK.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagUK.createMessage(context, args);
  }
}
