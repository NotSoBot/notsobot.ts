import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export const COMMAND_NAME = 'invert';

export default class InvertCommand extends BaseImageCommand<Formatter.Commands.ImageInvert.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Invert an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageInvert.CommandArgs) {
    return Formatter.Commands.ImageInvert.createMessage(context, args);
  }
}
