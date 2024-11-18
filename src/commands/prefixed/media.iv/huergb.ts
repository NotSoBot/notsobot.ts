import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'huergb';

export default class HueRGBCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Shift an Image or Video\'s RGB Pixel Color by X amount',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot 90 45 180`,
        ],
        id: Formatter.Commands.MediaIVManipulationHueShiftRGB.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<red:number> ?<green:number> ?<blue:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'red'},
        {name: 'green'},
        {name: 'blue', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationHueShiftRGB.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueShiftRGB.createMessage(context, args);
  }
}
