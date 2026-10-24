import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'pakistan';

export class MediaIVFlagPakistanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Pakistani flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.pakistan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagPakistan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.pakistan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagPakistan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagPakistan.createMessage(context, args);
  }
}
