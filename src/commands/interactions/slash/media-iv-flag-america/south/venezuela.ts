import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'venezuela';

export class MediaIVFlagVenezuelaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Venezuelan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.venezuela.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagVenezuela.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.venezuela.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagVenezuela.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagVenezuela.createMessage(context, args);
  }
}
