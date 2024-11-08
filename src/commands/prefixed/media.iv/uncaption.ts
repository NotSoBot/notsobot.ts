import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'uncaption';

export default class UncaptionCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'tolerance', aliases: ['t'], type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Uncaption an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -tolerance 50`,
        ],
        id: Formatter.Commands.MediaIVManipulationUncaption.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-tolerance <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationUncaption.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationUncaption.createMessage(context, args);
  }
}
