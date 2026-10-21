import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'sanmarino';

export class MediaIVFlagSanMarinoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a San Marino flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.sanmarino.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSanMarino.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.sanmarino.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSanMarino.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSanMarino.createMessage(context, args);
  }
}
