import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'kiribati';

export class MediaIVFlagKiribatiCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Kiribati flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.kiribati.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagKiribati.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.kiribati.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagKiribati.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagKiribati.createMessage(context, args);
  }
}
