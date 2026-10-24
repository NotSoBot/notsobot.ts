import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'easttimor';

export class MediaIVFlagEastTimorCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay an East Timorese flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.easttimor.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagEastTimor.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.easttimor.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagEastTimor.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagEastTimor.createMessage(context, args);
  }
}
