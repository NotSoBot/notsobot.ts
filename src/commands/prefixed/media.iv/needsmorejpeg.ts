import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'needsmorejpeg';

export default class NeedsMoreJPEGCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['nmj', 'jpeg'],
      args: [
        {aliases: ['nt'], name: 'notransparency', type: Boolean},
        {aliases: ['q'], name: 'quality', type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Needs More JPEG',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -quality 20`,
        ],
        id: Formatter.Commands.MediaIVManipulationJPEG.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-notransparency) (-quality <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationJPEG.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationJPEG.createMessage(context, args);
  }
}
