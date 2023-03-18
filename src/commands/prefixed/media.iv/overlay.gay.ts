import { Command, CommandClient } from 'detritus-client';

import { imageOverlayFlagLGBT } from '../../../api';
import { CommandCategories } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'overlay gay';

export default class OverlayGayCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o gay', 'gay', 'overlay lgbt', 'o lgbt', 'lgbt'],
      metadata: {
        description: 'Overlay a LGBT flag over an Image or Video',
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
    const response = await imageOverlayFlagLGBT(context, args);
    return imageReply(context, response);
  }
}
