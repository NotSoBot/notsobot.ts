import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'mirror bottom';

export default class MirrorBottomCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['hooh'],
      args: [
        {aliases: ['p'], name: 'percentage', type: Number, metadata: {description: '1 to 99, how much of the media the reflection covers (default 50)'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Mirror the bottom half of an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -percentage 15`,
        ],
        id: Formatter.Commands.MediaIVManipulationMirrorBottom.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-percentage <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationMirrorBottom.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMirrorBottom.createMessage(context, args);
  }
}
