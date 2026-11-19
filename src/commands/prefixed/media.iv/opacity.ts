import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'opacity';

export default class OpacityCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['alpha', 'transparency'],

      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make an Image see-through (100 is fully visible, 0 is invisible)',
        examples: [
          `${COMMAND_NAME}`,
          `${COMMAND_NAME} 25`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png 70`,
        ],
        id: Formatter.Commands.MediaIVManipulationOpacity.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<percentage:float>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false, video: false})},
        {name: 'percentage', consume: true, type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOpacity.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOpacity.createMessage(context, args);
  }
}
