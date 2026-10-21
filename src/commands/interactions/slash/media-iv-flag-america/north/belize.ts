import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'belize';

export class MediaIVFlagBelizeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Belizean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.belize.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBelize.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.belize.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBelize.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBelize.createMessage(context, args);
  }
}
