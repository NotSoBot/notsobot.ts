import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'ghana';

export class MediaIVFlagGhanaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Ghanaian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.ghana.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagGhana.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.ghana.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagGhana.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagGhana.createMessage(context, args);
  }
}
