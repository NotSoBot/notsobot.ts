import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'lebanon';

export class MediaIVFlagLebanonCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Lebanese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.lebanon.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagLebanon.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.lebanon.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagLebanon.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLebanon.createMessage(context, args);
  }
}
