import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'libya';

export class MediaIVFlagLibyaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Libyan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.libya.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagLibya.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.libya.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagLibya.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLibya.createMessage(context, args);
  }
}
