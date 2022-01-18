import { Command, CommandClient } from 'detritus-client';

import { imageManipulationWall } from '../../../api';
import { CommandTypes } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'wall';

export default class WallCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Create a wall with an image',
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
    const response = await imageManipulationWall(context, args);
    return imageReply(context, response);
  }
}
