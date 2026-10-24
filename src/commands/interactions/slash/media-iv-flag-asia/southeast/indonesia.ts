import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'indonesia';

export class MediaIVFlagIndonesiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Indonesian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.indonesia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagIndonesia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.indonesia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagIndonesia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagIndonesia.createMessage(context, args);
  }
}
