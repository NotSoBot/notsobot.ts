import { Command, CommandClient } from 'detritus-client';

import { imageGlitchGif } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  amount?: number,
  iterations?: number,
  seed?: number,
  url?: null | string,
}

export interface CommandArgs {
  amount?: number,
  iterations?: number,
  seed?: number,
  url: string,
}

export const COMMAND_NAME = 'glitch gif';

export default class GlitchGifCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'amount', type: Number},
        {name: 'iterations', type: Number},
        {name: 'seed', type: Number},
        //{name: 'type'}, // theres glitch2, but maybe get rid of it?
      ],
      metadata: {
        description: 'Glitch an animated Image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -seed 68`,
        ],
        type: CommandTypes.IMAGE,
        usage: `${COMMAND_NAME} ?<emoji|id|mention|name|url> (-amount <number>) (-iterations <number>) (-seed <number>)`, // (-type <glitch-type>)
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageGlitchGif(context, args);
    return imageReply(context, response);
  }
}
