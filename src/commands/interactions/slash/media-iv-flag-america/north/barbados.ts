import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'barbados';

export class MediaIVFlagBarbadosCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Barbadian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.barbados.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBarbados.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.barbados.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBarbados.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBarbados.createMessage(context, args);
  }
}
