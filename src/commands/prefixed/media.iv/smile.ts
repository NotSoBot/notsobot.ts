import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaFaceSmileLevels } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'smile';

export default class SmileCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'level', aliases: ['l'], type: Parameters.oneOf({choices: MediaFaceSmileLevels})},
      ],
      metadata: {
        description: 'Make all the characters in an Image or Video smile so big.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -level HUGE`,
        ],
        id: Formatter.Commands.MediaIVManipulationSmile.COMMAND_ID,
        category: CommandCategories.EFFECTS,
        usage: '?<emoji,user:id|mention|name,url> (-level <choice>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSmile.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSmile.createMessage(context, args);
  }
}
