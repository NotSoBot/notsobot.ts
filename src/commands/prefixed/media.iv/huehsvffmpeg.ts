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
        category: CommandCategories.EFFECTS,
        description: 'Turn an Image or Video\'s Hue with FFmpeg\'s hue filter, keeping its Brightness (not HSV)',
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
