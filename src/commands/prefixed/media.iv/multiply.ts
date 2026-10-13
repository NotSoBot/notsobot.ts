import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'multiply';

export default class MultiplyCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['g'], name: 'grid', type: Number},
        {name: 'rotate', type: Boolean},
        {aliases: ['s'], name: 'seed', type: Number},
      ],
      metadata: {
        description: 'Repeat an Image or Video in a grid',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -grid 4 -rotate`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationMultiply.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-grid <number>) (-rotate) (-seed <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationMultiply.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMultiply.createMessage(context, args);
  }
}
