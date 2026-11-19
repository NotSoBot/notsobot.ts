import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'darken';

export default class DarkenCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Darken an Image or Video',
        examples: [
          `${COMMAND_NAME}`,
          `${COMMAND_NAME} 50`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 30`,
        ],
        id: Formatter.Commands.MediaIVManipulationDarken.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<percentage:float>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'percentage', consume: true, type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDarken.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDarken.createMessage(context, args);
  }
}
