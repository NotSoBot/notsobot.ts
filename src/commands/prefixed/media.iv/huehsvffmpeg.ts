import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'huehsvffmpeg';

export default class HueHSVFFMPEGCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['huehsvf'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Shift an Image or Video\'s HSV Hue, Saturation, and Brightness by X amount using FFMPEG',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot 90 1 2.5`,
        ],
        id: Formatter.Commands.MediaIVManipulationHueShiftHSVFFMPEG.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<hue:number> ?<saturation:float> ?<brightness:float>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'hue'},
        {name: 'saturation'},
        {name: 'brightness', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationHueShiftHSVFFMPEG.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueShiftHSVFFMPEG.createMessage(context, args);
  }
}
