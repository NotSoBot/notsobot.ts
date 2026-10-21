import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'saintkitts';

export class MediaIVFlagSaintKittsCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Saint Kitts and Nevis flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.saintkitts.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSaintKitts.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.saintkitts.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSaintKitts.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSaintKitts.createMessage(context, args);
  }
}
