import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'chile';

export class MediaIVFlagChileCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Chilean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.chile.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagChile.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.chile.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagChile.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagChile.createMessage(context, args);
  }
}
