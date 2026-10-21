import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'greece';

export class MediaIVFlagGreeceCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Greek flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.greece.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagGreece.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.greece.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagGreece.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagGreece.createMessage(context, args);
  }
}
