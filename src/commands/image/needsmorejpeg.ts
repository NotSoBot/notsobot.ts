import { Command } from 'detritus-client';

import { imageJPEG } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  quality?: number,
  url?: null | string,
}

export interface CommandArgs {
  quality?: number,
  url: string,
}

export default class NeedsMoreJPEGCommand extends BaseImageCommand<CommandArgs> {
  name = 'needsmorejpeg';

  aliases = ['nmj', 'jpeg'];
  args = [
    {aliases: ['q'], name: 'quality', type: Number},
  ];
  metadata = {
    description: 'Needs More JPEG',
    examples: [
      'needsmorejpeg',
      'needsmorejpeg cake',
      'needsmorejpeg cake -quality 20',
    ],
    type: CommandTypes.IMAGE,
    usage: 'needsmorejpeg ?<emoji|id|mention|name|url> (-quality <number>)',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageJPEG(context, args);
    return imageReply(context, response);
  }
}
