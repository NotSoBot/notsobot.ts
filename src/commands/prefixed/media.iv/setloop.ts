import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'setloop';

export default class SetLoopCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Set how many times an Animated Image plays (0 is forever)',
        examples: [
          `${COMMAND_NAME} 1`,
          `${COMMAND_NAME} 0`,
        ],
        id: Formatter.Commands.MediaIVManipulationSetLoop.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<times:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false, video: false})},
        {name: 'amount', consume: true, type: Number},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSetLoop.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSetLoop.createMessage(context, args);
  }
}
