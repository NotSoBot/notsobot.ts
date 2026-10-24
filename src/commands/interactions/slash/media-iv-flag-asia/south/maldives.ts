import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'maldives';

export class MediaIVFlagMaldivesCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Maldivian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.maldives.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMaldives.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.maldives.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMaldives.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMaldives.createMessage(context, args);
  }
}
