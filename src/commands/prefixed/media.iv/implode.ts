import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'implode';

export default class ImplodeCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['s'], name: 'scale', type: 'float'},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Implode an Image or Video from the center',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -scale 5`,
        ],
        id: Formatter.Commands.MediaIVManipulationImplode.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-scale <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationImplode.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationImplode.createMessage(context, args);
  }
}
