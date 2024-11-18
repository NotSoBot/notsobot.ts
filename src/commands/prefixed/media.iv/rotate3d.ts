import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaRotate3dCropModes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'rotate3d';

export default class Rotate3dCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'crop', type: Parameters.oneOf({choices: MediaRotate3dCropModes})},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Rotate an Image or Video on a 3d axis',
        examples: [
          `${COMMAND_NAME} notsobot 45 0 45`,
        ],
        id:  Formatter.Commands.MediaIVToolsRotate3d.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <pan:number> <tilt:number> <roll:number> (-crop <MediaRotate3dCropModes>)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'pan', type: Number},
        {name: 'tilt', type: Number},
        {name: 'roll', type: Number, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaIVToolsRotate3d.CommandArgs) {
    if (!args.pan && !args.tilt && !args.roll) {
      return false;
    }
    return super.onBeforeRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsRotate3d.CommandArgs) {
    return Formatter.Commands.MediaIVToolsRotate3d.createMessage(context, args);
  }
}
