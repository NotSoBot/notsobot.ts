import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'magik';

export default class MagikCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['magic'],
      args: [
        {aliases: ['s'], name: 'scale', type: 'float'},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Magikify an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -scale 5`,
        ],
        id: Formatter.Commands.MediaIVManipulationMagik.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-scale <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationMagik.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMagik.createMessage(context, args);
  }
}
