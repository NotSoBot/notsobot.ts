import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop-circle';

export class MediaIVToolsCropCircleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Crop out a circle from an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.crop_circle.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCropCircle.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.crop_circle.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCropCircle.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCropCircle.createMessage(context, args);
  }
}
