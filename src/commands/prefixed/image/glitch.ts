import { Command, CommandClient } from 'detritus-client';

import { imageManipulationGlitch } from '../../../api';
import { CommandTypes } from '../../../constants';
import { imageReply } from '../../../utils';

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

export const COMMAND_NAME = 'glitch';

export default class GlitchCommand extends BaseImageCommand<CommandArgs> {
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
        description: 'Glitch an Image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -seed 68`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url> (-amount <number>) (-iterations <number>) (-seed <number>)', // (-type <glitch-type>)
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageManipulationGlitch(context, args);
    return imageReply(context, response);
  }
}
