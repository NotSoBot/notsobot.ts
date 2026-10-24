import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'brunei';

export class MediaIVFlagBruneiCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Bruneian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.brunei.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBrunei.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.brunei.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBrunei.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBrunei.createMessage(context, args);
  }
}
