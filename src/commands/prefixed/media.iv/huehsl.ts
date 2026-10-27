import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'huehsl';

export default class HueHSLCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['hueshifthsl'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Shift an Image or Video\'s HSL Hue, Saturation, and Lightness by X amount using ImageMagick',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot 90 -50 20`,
        ],
        id: Formatter.Commands.MediaIVManipulationHueShiftHSL.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<hue:number> ?<saturation:float> ?<lightness:float>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'hue'},
        {name: 'saturation'},
        {name: 'lightness', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationHueShiftHSL.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueShiftHSL.createMessage(context, args);
  }
}
