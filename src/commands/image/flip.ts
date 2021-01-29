import { Command, CommandClient } from 'detritus-client';

import { imageFlip } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'flip';

export default class FlipCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Flip an image (Vertical Flip)',
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
    const response = await imageFlip(context, args);
    return imageReply(context, response);
  }
}
