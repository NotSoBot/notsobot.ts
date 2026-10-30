import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop-face';

export class MediaIVToolsCropFaceCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Crop an Image or Video to a face, following it on every frame';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.crop_face.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCropFace.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.crop_face.name');

  constructor() {
    super({
      options: [
        {
          name: 'face',
          description: 'Face Number, the One drawfaces Shows (0..99) (Default: 0)',
          ...I18n.optionLocalizations('commands.media_iv_tools.crop_face.face'),
          type: ApplicationCommandOptionTypes.INTEGER,
          minValue: 0,
          maxValue: 99,
        },
        {
          name: 'zoom',
          description: 'Crop Each Frame to Its Face and Scale It Up to the Biggest Face (Default: False)',
          ...I18n.optionLocalizations('commands.media_iv_tools.crop_face.zoom'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCropFace.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCropFace.createMessage(context, args);
  }
}
