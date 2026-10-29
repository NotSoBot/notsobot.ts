import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'wobble';

export default class WobbleCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'amount', aliases: ['a'], type: 'float', metadata: {description: '1 to 100, percent of the size'}},
        {name: 'duration', aliases: ['d'], type: 'float', metadata: {description: '0.5 to 30 seconds, for still images'}},
        {name: 'wobbles', aliases: ['w'], type: 'float', metadata: {description: '0.1 to 10, per second'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make an Image or Video Wobble like Jelly',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -amount 60`,
          `${COMMAND_NAME} notsobot -wobbles 2 -duration 5`,
        ],
        id: Formatter.Commands.MediaIVManipulationWobble.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <float>) (-duration <float>) (-wobbles <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationWobble.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationWobble.createMessage(context, args);
  }
}
