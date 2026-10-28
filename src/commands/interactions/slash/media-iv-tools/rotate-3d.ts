import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { MediaRotate3dCropModes } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'rotate-3d';

export class MediaIVToolsRotate3dCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Rotate an Image or Video on a 3d axis';
  descriptionLocalizations = I18n.localizations('commands.media_iv_tools.rotate_3d.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRotate3d.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_tools.rotate_3d.name');

  constructor() {
    super({
      options: [
        {name: 'pan', description: 'Vertical Centerline Rotation (-360..360)', ...I18n.optionLocalizations('commands.media_iv_tools.rotate_3d.pan'), type: Number},
        {name: 'tilt', description: 'Horizontal Centerline Rotation (-360..360)', ...I18n.optionLocalizations('commands.media_iv_tools.rotate_3d.tilt'), type: Number},
        {name: 'roll', description: 'Regular Rotation (-360..360)', ...I18n.optionLocalizations('commands.media_iv_tools.rotate_3d.roll'), type: Number},
        {name: 'order', description: 'Rotation Sequence (Default is \'ptr\', pan→tilt→roll)', ...I18n.optionLocalizations('commands.media_iv_tools.rotate_3d.order')},
        {name: 'zoom', description: 'Zoom Amount (-3.0..3.0)', ...I18n.optionLocalizations('commands.media_iv_tools.rotate_3d.zoom'), type: 'number'},
        {
          name: 'crop',
          description: 'Crop Modes',
          ...I18n.optionLocalizations('commands.media_iv_tools.rotate_3d.crop'),
          choices: Parameters.Slash.oneOf({choices: MediaRotate3dCropModes, defaultChoice: MediaRotate3dCropModes.NONE, localizationKey: 'choices.media_rotate_3d_crop_modes'}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRotate3d.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRotate3d.createMessage(context, args);
  }
}
