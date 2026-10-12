import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'wasted';

export class MediaIVOverlayWastedCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a GTA Wasted screen on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.wasted.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayWasted.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.wasted.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayWasted.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayWasted.createMessage(context, args);
  }
}
