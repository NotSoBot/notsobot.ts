import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'philippines';

export class MediaIVFlagPhilippinesCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Overlay a Philippine flag over an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv.flag.philippines.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlayFlagPhilippines.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.flag.philippines.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlayFlagPhilippines.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagPhilippines.createMessage(context, args);
  }
}
