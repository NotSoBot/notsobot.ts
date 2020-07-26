import { Command } from 'detritus-client';

import { imageMagik } from '../../api';
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

export default class MagikCommand extends BaseImageCommand<CommandArgs> {
  name = 'magik';

  aliases = ['magic'];
  args = [
    {aliases: ['s'], name: 'scale', type: 'float'},
  ];
  metadata = {
    examples: ['magik', 'magik notsobot', 'magik notsobot -scale 5'],
    type: CommandTypes.IMAGE,
    usage: 'magik ?<emoji|id|mention|name|url> (-scale <float>)',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageMagik(context, args);
    return imageReply(context, response);
  }
}
