import { Command, CommandClient } from 'detritus-client';

import { imageToolsRotate } from '../../../api';
import { CommandTypes } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  degrees?: number,
  nocrop?: boolean,
  url?: null | string,
}

export interface CommandArgs {
  degrees?: number,
  nocrop?: boolean,
  url: string,
}

export const COMMAND_NAME = 'rotate';

export default class RotateCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'degrees', aliases: ['d'], type: Number},
        {name: 'nocrop', type: Boolean},
      ],
      metadata: {
        description: 'Rotate an Image (default 90 degrees)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -degrees 90`,
          `${COMMAND_NAME} notsobot -degrees 90 -nocrop`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url> (-degrees <number>) (-nocrop)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageToolsRotate(context, {
      crop: !args.nocrop,
      degrees: args.degrees,
      url: args.url,
    });
    return imageReply(context, response);
  }
}
