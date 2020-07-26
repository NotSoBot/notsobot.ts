import { Command } from 'detritus-client';

import { imageExplode } from '../../api';
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

export default class ExplodeCommand extends BaseImageCommand<CommandArgs> {
  name = 'explode';

  args = [
    {aliases: ['s'], name: 'scale', type: 'float'},
  ];
  metadata = {
    examples: ['explode', 'explode notsobot', 'explode notsobot -scale 5'],
    type: CommandTypes.IMAGE,
    usage: 'explode ?<emoji|id|mention|name|url> (-scale <float>)',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageExplode(context, args);
    return imageReply(context, response);
  }
}
