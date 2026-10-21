import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'belgium';

export class MediaIVFlagBelgiumCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Belgian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.belgium.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBelgium.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.belgium.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBelgium.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBelgium.createMessage(context, args);
  }
}
