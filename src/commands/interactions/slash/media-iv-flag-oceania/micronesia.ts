import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'micronesia';

export class MediaIVFlagMicronesiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Micronesian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.micronesia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagMicronesia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.micronesia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagMicronesia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagMicronesia.createMessage(context, args);
  }
}
