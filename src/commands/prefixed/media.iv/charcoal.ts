import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'charcoal';

export default class CharcoalCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['r'], name: 'radius', type: Number},
      ],
      metadata: {
        description: 'Apply a Charcoal Drawing effect to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -radius 5`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIVManipulationCharcoal.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-radius <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationCharcoal.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCharcoal.createMessage(context, args);
  }
}
