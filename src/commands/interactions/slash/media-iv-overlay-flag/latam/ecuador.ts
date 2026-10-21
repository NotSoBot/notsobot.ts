import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'ecuador';

export class MediaIVFlagEcuadorCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Ecuadorian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.ecuador.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagEcuador.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.ecuador.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagEcuador.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEcuador.createMessage(context, args);
  }
}
