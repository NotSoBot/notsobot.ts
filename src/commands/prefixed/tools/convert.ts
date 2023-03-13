import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'convert';

export default class ConvertCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'size'},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Convert Media',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot jpeg`,
          `${COMMAND_NAME} 👌🏿 png -size 2560`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png webp`,
          `${COMMAND_NAME} https://cdn.discordapp.com/attachments/560593330270896129/1054322096420950097/igVideo.mp4 mov`,
        ],
        id: Formatter.Commands.ToolsConvert.COMMAND_ID,
        usage: '<emoji,user:id|mention,url> <...format> (-size <number|(width)x(height)>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'to', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsConvert.CommandArgs) {
    return Formatter.Commands.ToolsConvert.createMessage(context, args);
  }
}
