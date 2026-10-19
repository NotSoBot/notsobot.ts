import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'timesquare';

export default class TimesquareCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['timessquare', 'nyc'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Put an Image or Video on a Times Square billboard',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationTimesquare.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationTimesquare.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTimesquare.createMessage(context, args);
  }
}
