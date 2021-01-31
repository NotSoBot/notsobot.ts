import { Command, CommandClient } from 'detritus-client';

import { imageManipulationPixelate } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
  width?: number,
}

export interface CommandArgs {
  url: string,
  width: number,
}

export const COMMAND_NAME = 'pixelate';

export default class PixelateCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['pixel'],
      args: [
        {name: 'width', type: Number},
      ],
      metadata: {
        description: 'Pixelate an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -width 2`,
        ],
        type: CommandTypes.IMAGE,
        usage: `${COMMAND_NAME} ?<emoji,user:id|mention|name,url> (-width <number>)`,
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageManipulationPixelate(context, {
      pixelWidth: args.width,
      url: args.url,
    });
    return imageReply(context, response);
  }
}
