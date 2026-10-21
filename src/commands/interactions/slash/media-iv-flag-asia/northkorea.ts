import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'northkorea';

export class MediaIVOverlayNorthKoreaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a North Korean flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.northkorea.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagNorthKorea.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.northkorea.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagNorthKorea.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNorthKorea.createMessage(context, args);
  }
}
