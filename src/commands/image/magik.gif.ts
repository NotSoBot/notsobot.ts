import { Command, CommandClient } from 'detritus-client';

import { imageManipulationMagikGif } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  convert?: string,
  scale: number,
  size?: string,
  url: string,
}

export const COMMAND_NAME = 'magik gif';

export default class MagikGifCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      aliases: ['magic gif'],
      name: COMMAND_NAME,

      metadata: {
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        type: CommandTypes.IMAGE,
        usage: `${COMMAND_NAME} ?<emoji,user:id|mention|name,url>`,
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageManipulationMagikGif(context, args);
    return imageReply(context, response);
  }
}
