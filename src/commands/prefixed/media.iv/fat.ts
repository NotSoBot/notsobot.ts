import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaFaceFatSizes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'fat';

export default class FatCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'size', aliases: ['s'], type: Parameters.oneOf({choices: MediaFaceFatSizes})},
        {name: 'face', aliases: ['f'], type: Number},
      ],
      metadata: {
        description: 'Fattify an Image or Video\'s face',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} -face 1`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationFaceFat.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-size <choice>) (-face <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceFat.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceFat.createMessage(context, args);
  }
}
