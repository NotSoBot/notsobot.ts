import { Command, CommandClient } from 'detritus-client';

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
  metadata = {
    examples: ['magik', 'magik notsobot'],
    type: CommandTypes.IMAGE,
    usage: 'magik ?<emoji|id|mention|name|url> (-scale <float>)',
  };

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [
        {aliases: ['s'], name: 'scale', type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    await context.triggerTyping();

    const response = await imageMagik(context, args);
    return imageReply(context, response, 'magik');
  }
}
