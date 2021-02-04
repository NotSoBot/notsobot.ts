import { Command, CommandClient } from 'detritus-client';

import { imageToolsGifSeeSaw } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'gif seesaw';

export default class GifSeeSawCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'See Saw a gif, add a reversed copy of itself at the end of it',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageToolsGifSeeSaw(context, args);
    return imageReply(context, response);
  }
}
