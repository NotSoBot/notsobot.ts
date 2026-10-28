import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'trans';

export class MediaIVOverlayTransCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Transgender pride flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.trans.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagTrans.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.trans.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagTrans.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagTrans.createMessage(context, args);
  }
}
