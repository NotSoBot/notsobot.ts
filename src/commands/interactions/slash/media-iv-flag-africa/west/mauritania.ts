import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'mauritania';

export class MediaIVFlagMauritaniaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Mauritanian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.mauritania.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMauritania.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.mauritania.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMauritania.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMauritania.createMessage(context, args);
  }
}
