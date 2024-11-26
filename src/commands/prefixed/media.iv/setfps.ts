import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'setfps';

export default class SetFPSCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Set an Animated Image or Video\'s FPS',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 24`,
        ],
        id: Formatter.Commands.MediaIVToolsSetFPS.COMMAND_ID,
        usage: '<emoji,user:id|mention,url> <...fps:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'fps', consume: true, type: Number},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsSetFPS.CommandArgs) {
    return Formatter.Commands.MediaIVToolsSetFPS.createMessage(context, args);
  }
}
