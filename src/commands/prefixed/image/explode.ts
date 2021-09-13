import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  scale?: number,
  url?: null | string,
}

export const COMMAND_NAME = 'explode';

export default class ExplodeCommand extends BaseImageCommand<Formatter.Commands.ImageExplode.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['s'], name: 'scale', type: 'float'},
      ],
      metadata: {
        description: 'Explode an image from the center',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -scale 5`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url> (-scale <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageExplode.CommandArgs) {
    return Formatter.Commands.ImageExplode.createMessage(context, args);
  }
}
