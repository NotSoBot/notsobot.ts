import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'costarica';

export class MediaIVFlagCostaRicaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Costa Rican flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.costarica.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagCostaRica.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.costarica.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagCostaRica.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCostaRica.createMessage(context, args);
  }
}
