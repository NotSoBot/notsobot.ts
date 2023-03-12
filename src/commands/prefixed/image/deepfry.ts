import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'deepfry';

export default class DeepfryCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['s'], name: 'scale', type: 'float'},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Deep fry an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -scale 5`,
        ],
        id: Formatter.Commands.MediaIVManipulationDeepfry.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-scale <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDeepfry.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDeepfry.createMessage(context, args);
  }
}
