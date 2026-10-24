import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'hueshiftyiq';

export default class HueShiftYIQCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['yiq'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Rotate an Image or Video\'s Hue in YIQ (NTSC) color space, keeping its brightness',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot 180`,
        ],
        id: Formatter.Commands.MediaIVManipulationHueShiftYIQ.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<rotate hue:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'hue', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationHueShiftYIQ.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHueShiftYIQ.createMessage(context, args);
  }
}
