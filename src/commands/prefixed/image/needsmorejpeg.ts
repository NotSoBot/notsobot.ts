import { Command, CommandClient } from 'detritus-client';

import { imageManipulationJPEG } from '../../../api';
import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

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

export default class NeedsMoreJPEGCommand extends BaseImageCommand<Formatter.Commands.ImageNeedsMoreJpeg.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['nmj', 'jpeg'],
      args: [
        {aliases: ['q'], name: 'quality', type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Needs More JPEG',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -quality 20`,
        ],
        id: Formatter.Commands.ImageNeedsMoreJpeg.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-quality <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageNeedsMoreJpeg.CommandArgs) {
    return Formatter.Commands.ImageNeedsMoreJpeg.createMessage(context, args);
  }
}
