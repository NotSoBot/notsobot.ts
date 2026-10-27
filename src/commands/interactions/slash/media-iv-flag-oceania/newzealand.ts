import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'newzealand';

export class MediaIVFlagNewZealandCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a New Zealand flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.newzealand.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagNewZealand.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.newzealand.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagNewZealand.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagNewZealand.createMessage(context, args);
  }
}
