import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'saintvincent';

export class MediaIVFlagSaintVincentCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Saint Vincent and the Grenadines flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.saintvincent.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSaintVincent.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.saintvincent.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSaintVincent.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSaintVincent.createMessage(context, args);
  }
}
