import { Command, CommandClient } from 'detritus-client';

import { imageManipulationMeme } from '../../api';
import { CommandTypes } from '../../constants';
import { Parameters, imageReply } from '../../utils';

import { BaseCommand, BaseImageCommand } from '../basecommand';


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
        usage: '<emoji,user:id|mention,url> <...text>',
      },
      type: [
        {name: 'url', type: Parameters.imageUrlPositional},
        {name: 'text', consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgs) {
    return !!args.text && super.onBeforeRun(context, args);
  }

  onCancelRun(context: Command.Context, args: CommandArgs) {
    if (!args.text) {
      return BaseCommand.prototype.onCancelRun.call(this, context, args);
    }
    return super.onCancelRun(context, args);
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

    const response = await imageManipulationMeme(context, {bottom, top, url});
    return imageReply(context, response);
  }
}
