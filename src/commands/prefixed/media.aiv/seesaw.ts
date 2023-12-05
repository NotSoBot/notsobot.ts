import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'seesaw';

export default class SeeSawCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'See Saw an animated image/audio/video, add a reversed copy of itself at the end of it',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg`,
        ],
        id: Formatter.Commands.MediaAIVToolsSeeSaw.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVToolsSeeSaw.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsSeeSaw.createMessage(context, args);
  }
}
