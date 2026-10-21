import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'croatia';

export class MediaIVFlagCroatiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Croatian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.croatia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagCroatia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.croatia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagCroatia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagCroatia.createMessage(context, args);
  }
}
