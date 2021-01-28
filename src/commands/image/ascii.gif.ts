import { Command, CommandClient } from 'detritus-client';

import { imageAsciiGif } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'ascii gif';

export default class AsciiGifCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Ascii-fy an Animated Image',
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
    const response = await imageAsciiGif(context, args);
    return imageReply(context, response);
  }
}
