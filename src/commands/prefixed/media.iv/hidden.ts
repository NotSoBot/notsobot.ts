import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'hidden';

export default class HiddenCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'share', aliases: ['sh'], type: Number, metadata: {description: '1 to 50, how much of the media shows through (Default: 10)'}},
        {name: 'size', aliases: ['s'], type: Number, metadata: {description: '1 to 10, checker square size in pixels (Default: 1)'}},
      ],
      metadata: {
        description: 'Hide an Image or Video in a checkerboard, it shows when you step back or squint',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -share 15`,
          `${COMMAND_NAME} notsobot -size 2`,
        ],
        id: Formatter.Commands.MediaIVManipulationHidden.COMMAND_ID,
        category: CommandCategories.EFFECTS,
        usage: '?<emoji,user:id|mention|name,url> (-share <number>) (-size <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationHidden.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationHidden.createMessage(context, args);
  }
}
