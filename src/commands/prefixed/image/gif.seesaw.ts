import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'gif seesaw';

export default class GifSeeSawCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'See Saw a gif, add a reversed copy of itself at the end of it',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg`,
        ],
        id: Formatter.Commands.MediaIVToolsFramesSeeSaw.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsFramesSeeSaw.CommandArgs) {
    return Formatter.Commands.MediaIVToolsFramesSeeSaw.createMessage(context, args);
  }
}
