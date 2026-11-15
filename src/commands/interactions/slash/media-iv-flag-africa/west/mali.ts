import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'mali';

export class MediaIVFlagMaliCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Malian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.mali.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMali.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.mali.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMali.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMali.createMessage(context, args);
  }
}
