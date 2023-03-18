import { Command, CommandClient } from 'detritus-client';

import { imageOverlayHalfLifeSMG } from '../../../api';
import { CommandCategories } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'overlay smg';

export default class OverlaySMGCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o smg', 'smg'],
      metadata: {
        description: 'Overlay a Half Life SMG over an Image or Video',
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
    const response = await imageOverlayHalfLifeSMG(context, args);
    return imageReply(context, response);
  }
}
