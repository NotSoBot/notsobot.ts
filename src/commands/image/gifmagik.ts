import { Command } from 'detritus-client';

import { imageMagikGif } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  convert?: string,
  scale: number,
  size?: string,
  url: string,
}

export default class GifMagikCommand extends BaseImageCommand<CommandArgs> {
  name = 'gifmagik';

  aliases = ['gifmagic', 'gmagik', 'gmagic'];
  label = 'url';
  metadata = {
    examples: ['gifmagik', 'gifmagik notsobot'],
    type: CommandTypes.IMAGE,
    usage: 'gifmagik ?<emoji|id|mention|name|url>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageMagikGif(context, args);
    return imageReply(context, response);
  }
}
