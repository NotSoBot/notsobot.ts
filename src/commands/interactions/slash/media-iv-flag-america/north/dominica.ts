import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'dominica';

export class MediaIVFlagDominicaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Dominica flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.dominica.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagDominica.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.dominica.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagDominica.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagDominica.createMessage(context, args);
  }
}
