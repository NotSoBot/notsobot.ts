import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'spain';

export class MediaIVFlagSpainCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Spanish flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.spain.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagSpain.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.spain.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagSpain.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagSpain.createMessage(context, args);
  }
}
