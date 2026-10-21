import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'luxembourg';

export class MediaIVFlagLuxembourgCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Luxembourgish flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.luxembourg.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagLuxembourg.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.luxembourg.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagLuxembourg.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagLuxembourg.createMessage(context, args);
  }
}
