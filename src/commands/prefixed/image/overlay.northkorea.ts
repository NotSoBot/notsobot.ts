import { Command, CommandClient } from 'detritus-client';

import { imageOverlayFlagNorthKorea } from '../../../api';
import { CommandTypes } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'overlay northkorea';

export default class OverlayNorthKoreaCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o northkorea', 'overlay nk', 'o nk', 'northkorea', 'nk'],
      metadata: {
        description: 'Overlay a North Korean flag over an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageOverlayFlagNorthKorea(context, args);
    return imageReply(context, response);
  }
}
