import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'peru';

export class MediaIVFlagPeruCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Peruvian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.peru.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagPeru.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.peru.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagPeru.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagPeru.createMessage(context, args);
  }
}
