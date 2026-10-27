import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'nauru';

export class MediaIVFlagNauruCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Nauruan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.nauru.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagNauru.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.nauru.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagNauru.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNauru.createMessage(context, args);
  }
}
