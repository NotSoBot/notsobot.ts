import { Command, CommandClient } from 'detritus-client';

import { imageManipulationMirrorRight } from '../../../api';
import { CommandTypes } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'mirror right';

export default class MirrorRightCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['waaw'],
      metadata: {
        description: 'Mirror right half of image',
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
    const response = await imageManipulationMirrorRight(context, {url: args.url});
    return imageReply(context, response, 'mirror-right');
  }
}
