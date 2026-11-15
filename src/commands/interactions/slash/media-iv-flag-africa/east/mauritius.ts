import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'mauritius';

export class MediaIVFlagMauritiusCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Mauritian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.mauritius.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMauritius.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.mauritius.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMauritius.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMauritius.createMessage(context, args);
  }
}
