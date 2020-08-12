import { Command } from 'detritus-client';

import { imageImplode } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  scale?: number,
  url?: null | string,
}

export interface CommandArgs {
  scale?: number,
  url: string,
}

export default class ImplodeCommand extends BaseImageCommand<CommandArgs> {
  name = 'implode';

  args = [
    {aliases: ['s'], name: 'scale', type: 'float'},
  ];
  metadata = {
    description: 'Implode an image from the center',
    examples: ['implode', 'implode notsobot', 'implode notsobot -scale 5'],
    type: CommandTypes.IMAGE,
    usage: 'implode ?<emoji|id|mention|name|url> (-scale <float>)',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageImplode(context, args);
    return imageReply(context, response);
  }
}
