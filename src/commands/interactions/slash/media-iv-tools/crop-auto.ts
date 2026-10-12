import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop-auto';

export class MediaIVToolsCropAutoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Crop an Image or Video automatically';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.crop_auto.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCropAuto.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.crop_auto.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCropAuto.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCropAuto.createMessage(context, args);
  }
}
