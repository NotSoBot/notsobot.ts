import { Command } from 'detritus-client';

import { imageDeepfry } from '../../api';
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

export default class DeepfryCommand extends BaseImageCommand<CommandArgs> {
  name = 'deepfry';

  args = [
    {aliases: ['s'], name: 'scale', type: 'float'},
  ];
  metadata = {
    description: 'Deep fry an image',
    examples: ['deepfry', 'deepfry notsobot', 'deepfry notsobot -scale 5'],
    type: CommandTypes.IMAGE,
    usage: 'deepfry ?<emoji|id|mention|name|url> (-scale <float>)',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageDeepfry(context, args);
    return imageReply(context, response);
  }
}
