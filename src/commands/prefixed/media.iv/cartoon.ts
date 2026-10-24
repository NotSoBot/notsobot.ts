import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaCartoonMethods } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'cartoon';

export default class CartoonCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['a'], name: 'amount', type: 'float', metadata: {description: '0 to 10'}},
        {aliases: ['b'], name: 'brightness', type: Number, metadata: {description: '0 to 100'}},
        {aliases: ['l'], name: 'levels', type: Number, metadata: {description: '2 to 10'}},
        {
          aliases: ['m'],
          name: 'method',
          choices: Object.values(MediaCartoonMethods),
          help: `Must be one of: (${Object.values(MediaCartoonMethods).join(', ')})`,
          type: (value: string) => value.toUpperCase(),
        },
        {aliases: ['p'], name: 'pattern', type: Number, metadata: {description: '0 to 100'}},
        {aliases: ['s', 'strength'], name: 'saturation', type: Number, metadata: {description: '0 to 300'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Apply a Cartoon Effect on an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -method SOBEL_EDGES -levels 4`,
        ],
        id: Formatter.Commands.MediaIVManipulationCartoon.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <float>) (-brightness <number>) (-levels <number>) (-method <choice>) (-pattern <number>) (-saturation <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationCartoon.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCartoon.createMessage(context, args);
  }
}
