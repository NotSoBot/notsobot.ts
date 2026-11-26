import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'bighead';

export default class BigHeadCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['big head', 'bobblehead'],
      args: [
        {name: 'size', aliases: ['s'], type: Number, metadata: {description: '1.1 to 3'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make every head in an Image or Video bigger, like a bobblehead',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -size 2.2`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceBigHead.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-size <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceBigHead.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceBigHead.createMessage(context, args);
  }
}
