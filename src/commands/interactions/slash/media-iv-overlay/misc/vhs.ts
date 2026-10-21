import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'vhs';

export class MediaIVOverlayVHSCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a VHS camcorder recording screen on an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.vhs.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayVHS.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.vhs.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayVHS.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayVHS.createMessage(context, args);
  }
}
