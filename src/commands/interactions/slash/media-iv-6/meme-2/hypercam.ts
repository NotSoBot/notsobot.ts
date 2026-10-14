import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'hypercam';

export class MediaIVMemeHyperCamCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add an "Unregistered HyperCam 2" watermark to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_6.meme_2.hypercam.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayHyperCam.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_6.meme_2.hypercam.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayHyperCam.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayHyperCam.createMessage(context, args);
  }
}
