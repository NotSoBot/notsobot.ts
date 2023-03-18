import { Command, CommandClient } from 'detritus-client';

import { imageOverlayFlagUK } from '../../../api';
import { CommandCategories } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'overlay uk';

export default class OverlayUKCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o uk', 'uk'],
      metadata: {
        description: 'Overlay a United Kingdom flag over an Image or Video',
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
    const response = await imageOverlayFlagUK(context, args);
    return imageReply(context, response);
  }
}
