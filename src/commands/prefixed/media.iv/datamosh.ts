import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'datamosh';

export default class DatamoshCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['c'], name: 'chance', type: Number},
        {aliases: ['r'], name: 'repeat', type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Datamosh an Animated Image or Video (Duplicates P-frames)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -chance 50 -repeat 10`,
        ],
        id: Formatter.Commands.MediaIVManipulationDatamosh.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-chance <number>) (-repeat <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDatamosh.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDatamosh.createMessage(context, args);
  }
}
