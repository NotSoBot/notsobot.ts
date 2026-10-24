import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'oman';

export class MediaIVFlagOmanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Omani flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.oman.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagOman.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.oman.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagOman.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagOman.createMessage(context, args);
  }
}
