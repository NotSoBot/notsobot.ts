import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'algeria';

export class MediaIVFlagAlgeriaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Algerian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.algeria.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagAlgeria.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.algeria.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagAlgeria.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAlgeria.createMessage(context, args);
  }
}
