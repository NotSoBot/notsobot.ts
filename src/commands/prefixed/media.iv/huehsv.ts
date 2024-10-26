import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'huehsv';

export default class HueHSVCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Shift an Image or Video\'s HSV Hue, Saturation, and Brightness by X amount',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot 90 45 180`,
        ],
        id: Formatter.Commands.MediaIVManipulationHueShiftHSV.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<hue:number> ?<saturation:number> ?<brightness:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'hue'},
        {name: 'saturation'},
        {name: 'brightness', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationHueShiftHSV.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueShiftHSV.createMessage(context, args);
  }
}
