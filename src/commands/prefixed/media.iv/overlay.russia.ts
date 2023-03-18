import { Command, CommandClient } from 'detritus-client';

import { imageOverlayFlagRussia } from '../../../api';
import { CommandCategories } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'overlay russia';

export default class OverlayRussiaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o russia', 'russia'],
      metadata: {
        description: 'Overlay a Russian flag over an Image or Video',
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
    const response = await imageOverlayFlagRussia(context, args);
    return imageReply(context, response);
  }
}
