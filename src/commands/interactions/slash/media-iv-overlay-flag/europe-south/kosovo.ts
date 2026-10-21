import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'kosovo';

export class MediaIVFlagKosovoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Kosovar flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.kosovo.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagKosovo.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.kosovo.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagKosovo.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagKosovo.createMessage(context, args);
  }
}
