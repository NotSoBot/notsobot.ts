import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'mirror right';

export default class MirrorRightCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['waaw'],
      args: [
        {aliases: ['p'], name: 'percentage', type: Number, metadata: {description: '1 to 99, how much of the media the reflection covers (default 50)'}},
      ],
      metadata: {
        description: 'Mirror the right half of an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -percentage 15`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationMirrorRight.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-percentage <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationMirrorRight.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMirrorRight.createMessage(context, args);
  }
}
