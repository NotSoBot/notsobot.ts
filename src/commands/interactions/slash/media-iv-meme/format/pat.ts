import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'pat';

export class MediaIVMemePatCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Pat an Image or Video with a hand (The Summer Hikaru Died gif)';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.pat.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayPat.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.pat.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayPat.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayPat.createMessage(context, args);
  }
}
