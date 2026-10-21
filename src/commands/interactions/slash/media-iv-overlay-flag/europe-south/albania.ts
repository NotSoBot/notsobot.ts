import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'albania';

export class MediaIVFlagAlbaniaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an Albanian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.albania.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagAlbania.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.albania.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagAlbania.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagAlbania.createMessage(context, args);
  }
}
