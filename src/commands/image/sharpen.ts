import { Command, CommandClient } from 'detritus-client';

import { imageManipulationSharpen } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  scale?: number,
  url?: null | string,
}

export interface CommandArgs {
  scale?: number,
  url: string,
}

export const COMMAND_NAME = 'sharpen';

export default class SharpenCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['s'], name: 'scale', type: 'float'},
      ],
      metadata: {
        description: 'Sharpen an image from the center',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -scale 5`,
        ],
        type: CommandTypes.IMAGE,
        usage:  '?<emoji,user:id|mention|name,url> (-scale <float>)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageManipulationSharpen(context, args);
    return imageReply(context, response);
  }
}
