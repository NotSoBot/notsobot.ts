import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'spin3d';

export default class Spin3dCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'clockwise', aliases: ['c'], type: Boolean},
        {name: 'tilt', aliases: ['t'], type: Number},
        {name: 'zoom', aliases: ['z'], type: 'float'},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Spin an Image or Video in 3d space, like the dancing cockroach',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -tilt 45`,
        ],
        id: Formatter.Commands.MediaIVManipulationSpin3d.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-clockwise) (-tilt <number>) (-zoom <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSpin3d.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSpin3d.createMessage(context, args);
  }
}
