import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  scale?: number,
  url?: null | string,
}

export const COMMAND_NAME = 'circle';

export default class CircleCommand extends BaseImageCommand<Formatter.Commands.ImageCircle.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['s'], name: 'scale', type: 'float'},
      ],
      metadata: {
        description: 'Put a radial blur on an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -scale 20`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url> (-scale <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageCircle.CommandArgs) {
    return Formatter.Commands.ImageCircle.createMessage(context, args);
  }
}
