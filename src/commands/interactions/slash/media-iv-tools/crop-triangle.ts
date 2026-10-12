import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop-triangle';

export class MediaIVToolsCropTriangleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Crop out a Triangle from an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.crop_triangle.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCropTriangle.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.crop_triangle.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCropTriangle.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCropTriangle.createMessage(context, args);
  }
}
