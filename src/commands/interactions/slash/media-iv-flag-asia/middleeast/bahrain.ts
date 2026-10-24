import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bahrain';

export class MediaIVFlagBahrainCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Bahraini flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.bahrain.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBahrain.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.bahrain.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBahrain.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBahrain.createMessage(context, args);
  }
}
