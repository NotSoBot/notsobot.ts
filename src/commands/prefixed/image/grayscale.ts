import { Command, CommandClient } from 'detritus-client';

import { imageManipulationGrayscale } from '../../../api';
import { CommandTypes } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'grayscale';

export default class GrayscaleCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['greyscale'],
      metadata: {
        description: 'Grayscale an Image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageManipulationGrayscale(context, args);
    return imageReply(context, response);
  }
}
