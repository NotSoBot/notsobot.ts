import { Command } from 'detritus-client';

import { imageInvert } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export default class InvertCommand extends BaseImageCommand<CommandArgs> {
  name = 'invert';

  metadata = {
    description: 'Invert an image',
    examples: ['invert', 'invert notsobot'],
    type: CommandTypes.IMAGE,
    usage: 'invert ?<emoji|id|mention|name|url>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageInvert(context, args);
    return imageReply(context, response);
  }
}
