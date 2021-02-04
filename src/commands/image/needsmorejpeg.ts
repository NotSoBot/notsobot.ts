import { Command, CommandClient } from 'detritus-client';

import { imageManipulationJPEG } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  quality?: number,
  url?: null | string,
}

export interface CommandArgs {
  quality?: number,
  url: string,
}

export const COMMAND_NAME = 'needsmorejpeg';

export default class NeedsMoreJPEGCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['nmj', 'jpeg'],
      args: [
        {aliases: ['q'], name: 'quality', type: Number},
      ],
      metadata: {
        description: 'Needs More JPEG',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -quality 20`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url> (-quality <number>)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageManipulationJPEG(context, args);
    return imageReply(context, response);
  }
}
