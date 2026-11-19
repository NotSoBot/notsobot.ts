import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'brightness';

export default class BrightnessCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['lighten'],

      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Brighten an Image or Video (negative numbers darken it)',
        examples: [
          `${COMMAND_NAME}`,
          `${COMMAND_NAME} 50`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -30`,
        ],
        id: Formatter.Commands.MediaIVManipulationBrightness.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<percentage:float>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'percentage', consume: true, type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationBrightness.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationBrightness.createMessage(context, args);
  }
}
