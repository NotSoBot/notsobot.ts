import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'contrast multiply';

export default class ContrastMultiplyCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['contrastmultiply'],

      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Multiply an Image or Video\'s contrast, keeping its colors (1 is unchanged, 0 is gray, negatives invert)',
        examples: [
          `${COMMAND_NAME}`,
          `${COMMAND_NAME} 3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -1`,
        ],
        id: Formatter.Commands.MediaIVManipulationContrastMultiply.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<multiplier:float>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'multiplier', consume: true, type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationContrastMultiply.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationContrastMultiply.createMessage(context, args);
  }
}
