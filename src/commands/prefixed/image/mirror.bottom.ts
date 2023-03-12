import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'mirror bottom';

export default class MirrorBottomCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['hooh'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Mirror bottom half of image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationMirrorBottom.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationMirrorBottom.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMirrorBottom.createMessage(context, args);
  }
}
