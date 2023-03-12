import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'circle';

export default class CircleCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['s'], name: 'scale', type: 'float'},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Put a radial blur on an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -scale 20`,
        ],
        id: Formatter.Commands.MediaIVManipulationCircle.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-scale <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationCircle.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCircle.createMessage(context, args);
  }
}
