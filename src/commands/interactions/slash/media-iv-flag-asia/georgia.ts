import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'georgia';

export class MediaIVFlagGeorgiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Georgian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.georgia.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagGeorgia.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.georgia.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagGeorgia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagGeorgia.createMessage(context, args);
  }
}
