import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'uruguay';

export class MediaIVFlagUruguayCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Uruguayan flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.uruguay.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagUruguay.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.uruguay.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagUruguay.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagUruguay.createMessage(context, args);
  }
}
