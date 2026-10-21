import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'argentina';

export class MediaIVFlagArgentinaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Argentine flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.argentina.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagArgentina.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.argentina.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagArgentina.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagArgentina.createMessage(context, args);
  }
}
