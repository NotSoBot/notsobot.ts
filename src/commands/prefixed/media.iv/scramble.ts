import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'scramble';

export default class ScrambleCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['g'], name: 'grid', type: Number, metadata: {description: '2 to 32'}},
        {aliases: ['nr'], name: 'norotate', type: Boolean},
        {aliases: ['s'], name: 'seed', type: Number, metadata: {description: '0 to 2147483647'}},
      ],
      metadata: {
        description: 'Shuffle the tiles of an Image or Video around',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -grid 5`,
          `${COMMAND_NAME} notsobot -norotate`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationScramble.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-grid <number>) (-norotate) (-seed <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationScramble.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationScramble.createMessage(context, args);
  }
}
