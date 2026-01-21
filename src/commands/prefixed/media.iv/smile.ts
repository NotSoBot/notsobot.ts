import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'smile';

export default class SmileCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Make all the characters in an Image or Video (first frame) smile so big.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationSmile.COMMAND_ID,
        category: CommandCategories.IMAGE,
        usage: '?<emoji,user:id|mention|name,url>',
      },
      ratelimits: [
        {duration: 6000, limit: 3, key: Formatter.Commands.ToolsMLImagine.COMMAND_ID, type: 'guild'},
        {duration: 2000, limit: 1, key: Formatter.Commands.ToolsMLImagine.COMMAND_ID, type: 'channel'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSmile.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSmile.createMessage(context, args);
  }
}
