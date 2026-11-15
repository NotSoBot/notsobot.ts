import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'cameroon';

export class MediaIVFlagCameroonCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Cameroonian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.cameroon.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagCameroon.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.cameroon.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagCameroon.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCameroon.createMessage(context, args);
  }
}
