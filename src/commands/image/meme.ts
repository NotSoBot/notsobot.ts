import { Command, CommandClient } from 'detritus-client';

import { imageMeme } from '../../api';
import { CommandTypes } from '../../constants';
import { Parameters, imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
  url?: null | string,
}

export interface CommandArgs {
  text: string,
  url: string,
}

export const COMMAND_NAME = 'meme';

export default class MemeCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot what an idiot`,
          `${COMMAND_NAME} notsobot what an idiot | lmao`,
        ],
        type: CommandTypes.IMAGE,
        usage: `${COMMAND_NAME} <emoji|id|mention|name|url> <...text>`,
      },
      type: [
        {name: 'url', required: true, type: Parameters.lastImageUrl},
        {name: 'text', consume: true},
      ],
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { text, url } = args;

    let top: string = '';
    let bottom: string | undefined;
    if (text.includes('|')) {
      [ top, bottom ] = text.split('|');
    } else {
      const split = text.split(' ');
      const half = Math.floor(split.length / 2);
      top = split.slice(0, half).join(' ');
      bottom = split.slice(half).join(' ');
    }

    const response = await imageMeme(context, {bottom, top, url});
    return imageReply(context, response);
  }
}
