import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { MediaRotate3dCropModes } from '../../../../constants';
import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'rotate-3d';

export class MediaIVToolsRotate3dCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Rotate an Image or Video on a 3d Axis';
  metadata = {
    id: Formatter.Commands.MediaIVToolsRotate3d.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'pan', description: 'Vertical Centerline Rotation (-360..360)', type: Number},
        {name: 'tilt', description: 'Horizontal Centerline Rotation (-360..360)', type: Number},
        {name: 'roll', description: 'Regular Rotation (-360..360)', type: Number},
        {
          name: 'crop',
          description: 'Crop Modes',
          choices: Parameters.Slash.oneOf({choices: MediaRotate3dCropModes, defaultChoice: MediaRotate3dCropModes.NONE}),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsRotate3d.CommandArgs) {
    return Formatter.Commands.MediaIVToolsRotate3d.createMessage(context, args);
  }
}
