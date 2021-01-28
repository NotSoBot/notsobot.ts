import { Command, CommandClient } from 'detritus-client';

import { imageAscii } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'ascii image';

export default class AsciiImageCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['ascii i'],
      metadata: {
        description: 'Ascii-fy an Image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        type: CommandTypes.IMAGE,
        usage: `${COMMAND_NAME} ?<emoji,user:id|mention|name,url>`,
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageAscii(context, args);
    return imageReply(context, response);
  }
}
