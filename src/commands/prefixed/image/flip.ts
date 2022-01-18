import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export const COMMAND_NAME = 'flip';

export default class FlipCommand extends BaseImageCommand<Formatter.Commands.ImageFlip.CommandArgs> {
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
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageFlip.CommandArgs) {
    return Formatter.Commands.ImageFlip.createMessage(context, args);
  }
}
