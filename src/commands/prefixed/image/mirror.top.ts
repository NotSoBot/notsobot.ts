import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'mirror top';

export default class MirrorTopCommand extends BaseImageCommand<Formatter.Commands.ImageMirrorTop.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['woow'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Mirror top half of image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.ImageMirrorTop.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageMirrorTop.CommandArgs) {
    return Formatter.Commands.ImageMirrorTop.createMessage(context, args);
  }
}
