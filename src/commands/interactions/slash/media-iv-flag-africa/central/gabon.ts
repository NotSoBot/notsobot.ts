import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'gabon';

export class MediaIVFlagGabonCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Gabonese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.gabon.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagGabon.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.gabon.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagGabon.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagGabon.createMessage(context, args);
  }
}
