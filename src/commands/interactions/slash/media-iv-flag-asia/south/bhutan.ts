import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bhutan';

export class MediaIVFlagBhutanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Bhutanese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.bhutan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagBhutan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.bhutan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagBhutan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagBhutan.createMessage(context, args);
  }
}
