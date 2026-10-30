import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaFaceForeheadSizes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'forehead';

export default class ForeheadCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'size', aliases: ['s'], type: Parameters.oneOf({choices: MediaFaceForeheadSizes})},
        {name: 'face', aliases: ['f'], type: Number},
      ],
      metadata: {
        description: 'Give an Image or Video\'s face a bigger forehead',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} -face 1`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationFaceForehead.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-size <choice>) (-face <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceForehead.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceForehead.createMessage(context, args);
  }
}
