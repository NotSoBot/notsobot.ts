import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'nonbinary';

export class MediaIVFlagNonBinaryCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Non-binary pride flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.nonbinary.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagNonBinary.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.nonbinary.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagNonBinary.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNonBinary.createMessage(context, args);
  }
}
