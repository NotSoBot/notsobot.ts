import { Command, CommandClient } from 'detritus-client';

import { imageOverlayFlagIsrael } from '../../../api';
import { CommandCategories } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'overlay irsael';

export default class OverlayIsraelCommand extends BaseImageOrVideoCommand{
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o israel', 'overlay hebrew', 'o hebrew', 'overlay jewish', 'o jewish', 'israel', 'hebrew', 'jewish'],
      metadata: {
        description: 'Overlay an Israeli flag over an Image or Video',
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
    const response = await imageOverlayFlagIsrael(context, args);
    return imageReply(context, response);
  }
}
