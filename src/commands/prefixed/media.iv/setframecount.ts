import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'setframecount';

export default class SetFrameCountCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['setfc'],
      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Set an Animated Image or Video\'s Frame Count',
        examples: [
          `${COMMAND_NAME} 24`,
        ],
        id: Formatter.Commands.MediaIVManipulationSetFrameCount.COMMAND_ID,
        usage: '<emoji,user:id|mention,url> <...count:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'count', consume: true, type: Number},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSetFrameCount.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSetFrameCount.createMessage(context, args);
  }
}
