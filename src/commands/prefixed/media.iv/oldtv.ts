import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'oldtv';

export default class OldtvCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['crt'],
      args: [
        {name: 'still', type: Boolean},
        {aliases: ['gray', 'greyscale'], name: 'grayscale', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Show an Image or Video on an old TV',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -still -grayscale`,
        ],
        id: Formatter.Commands.MediaIVManipulationOldTV.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-still) (-grayscale)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOldTV.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOldTV.createMessage(context, args);
  }
}
