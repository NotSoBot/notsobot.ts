import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'magik gif';

export default class MagikGifCommand extends BaseImageCommand<Formatter.Commands.ImageMagikGif.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      aliases: ['magic gif'],
      name: COMMAND_NAME,

      metadata: {
        description: 'Magikify a Gif/Image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.ImageMagikGif.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageMagikGif.CommandArgs) {
    return Formatter.Commands.ImageMagikGif.createMessage(context, args);
  }
}
