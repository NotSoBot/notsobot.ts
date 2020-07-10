import { Command, CommandClient, Utils } from 'detritus-client';

import { imageJPEG } from '../../api';
import { CommandTypes, EmbedColors } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  quality?: number,
  url?: null | string,
}

export interface CommandArgs {
  quality: number,
  url: string,
}

export default class JPEGCommand extends BaseImageCommand<CommandArgs> {
  name = 'jpeg';

  aliases = ['needsmorejpeg', 'nmj'];
  metadata = {
    description: 'Needs More Jpeg',
    examples: [
      'jpeg',
      'jpeg cake',
    ],
    type: CommandTypes.IMAGE,
    usage: 'jpeg ?<emoji|id|mention|name|url> (-quality <number>)',
  };

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [
        {aliases: ['q'], name: 'quality', type: Number},
      ],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    await context.triggerTyping();

    const response = await imageJPEG(context, args);
    return imageReply(context, response, 'jpeg');
  }
}
