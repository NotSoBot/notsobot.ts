import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'contrast';

export default class ContrastCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Raise or lower an Image or Video\'s contrast (-100 is flat gray, 100 is black and white)',
        examples: [
          `${COMMAND_NAME}`,
          `${COMMAND_NAME} 60`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -40`,
        ],
        id: Formatter.Commands.MediaIVManipulationContrast.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<amount:float>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'amount', consume: true, type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationContrast.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationContrast.createMessage(context, args);
  }
}
