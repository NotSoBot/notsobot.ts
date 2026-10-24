import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'kuwait';

export class MediaIVFlagKuwaitCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Kuwaiti flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.kuwait.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagKuwait.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.kuwait.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagKuwait.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagKuwait.createMessage(context, args);
  }
}
