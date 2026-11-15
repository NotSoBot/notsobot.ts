import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'sudan';

export class MediaIVFlagSudanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Sudanese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.sudan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSudan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.sudan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSudan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSudan.createMessage(context, args);
  }
}
