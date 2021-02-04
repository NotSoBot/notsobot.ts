import { Command, CommandClient } from 'detritus-client';

import { imageToolsRotate } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  degrees?: number,
  url?: null | string,
}

export interface CommandArgs {
  degrees?: number,
  url: string,
}

export const COMMAND_NAME = 'rotate';

export default class RotateCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'degrees', aliases: ['d'], type: Number},
      ],
      metadata: {
        description: 'Rotate an Image (default 90 degrees)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -degrees 90`
        ],
        type: CommandTypes.IMAGE,
        usage:  '?<emoji,user:id|mention|name,url> (-degrees <number>)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageToolsRotate(context, args);
    return imageReply(context, response);
  }
}
