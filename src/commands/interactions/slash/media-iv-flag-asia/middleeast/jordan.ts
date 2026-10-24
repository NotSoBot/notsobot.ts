import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'jordan';

export class MediaIVFlagJordanCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Jordanian flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.jordan.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagJordan.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.jordan.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagJordan.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagJordan.createMessage(context, args);
  }
}
