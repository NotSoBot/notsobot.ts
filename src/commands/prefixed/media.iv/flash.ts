import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'flash';

export default class FlashCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['d'], name: 'delay', type: Number},
      ],
      metadata: {
        description: 'Flash an Image or Video between normal and inverted',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -delay 200`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationFlash.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-delay <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFlash.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFlash.createMessage(context, args);
  }
}
