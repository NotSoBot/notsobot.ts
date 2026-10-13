import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'dice';

export default class DiceCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['g'], name: 'grid', type: Number},
        {aliases: ['s'], name: 'seed', type: Number},
      ],
      metadata: {
        description: 'Cut an Image or Video into tiles and randomly rotate each one',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -grid 5`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationDice.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-grid <number>) (-seed <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDice.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDice.createMessage(context, args);
  }
}
