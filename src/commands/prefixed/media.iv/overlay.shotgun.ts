import { Command, CommandClient } from 'detritus-client';

import { imageOverlayHalfLifeShotgun } from '../../../api';
import { CommandCategories } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'overlay shotgun';

export default class OverlayShotgunCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o shotgun', 'shotgun'],
      metadata: {
        description: 'Overlay a Half Life Shotgun over an Image or Video',
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
    const response = await imageOverlayHalfLifeShotgun(context, args);
    return imageReply(context, response);
  }
}
