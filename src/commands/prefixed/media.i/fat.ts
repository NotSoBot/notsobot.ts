import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaFaceFatSizes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'fat';

export default class FatCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'size', aliases: ['s'], type: Parameters.oneOf({choices: MediaFaceFatSizes})},
      ],
      metadata: {
        description: 'Fattify an Image\'s face',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIManipulationFaceFat.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-size <MediaFaceFatSizes>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIManipulationFaceFat.CommandArgs) {
    return Formatter.Commands.MediaIManipulationFaceFat.createMessage(context, args);
  }
}
