import { Command, CommandClient } from 'detritus-client';

import { imageOverlayFlagNorthKorea } from '../../../api';
import { CommandCategories } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'overlay northkorea';

export default class OverlayNorthKoreaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o northkorea', 'overlay nk', 'o nk', 'northkorea', 'nk'],
      metadata: {
        description: 'Overlay a North Korean flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageOverlayFlagNorthKorea(context, args);
    return imageReply(context, response);
  }
}
