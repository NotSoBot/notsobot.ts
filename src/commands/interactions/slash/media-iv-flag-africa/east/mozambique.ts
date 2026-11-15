import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'mozambique';

export class MediaIVFlagMozambiqueCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Mozambican flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.mozambique.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMozambique.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.mozambique.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMozambique.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMozambique.createMessage(context, args);
  }
}
