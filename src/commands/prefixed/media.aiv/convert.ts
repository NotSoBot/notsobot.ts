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
        {name: 'noaudio', aliases: ['na'], type: Boolean},
        {name: 'size', aliases: ['s']},
      ],
      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Convert an Audio, Image or Video File',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot jpeg`,
          `${COMMAND_NAME} 👌🏿 png -size 2560`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/b1.png webp`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 mov`,
        ],
        id: Formatter.Commands.MediaAIVManipulationConvert.COMMAND_ID,
        usage: '<emoji,user:id|mention,url> <...format> (-noaudio) (-size <number|(width)x(height)>)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'to', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationConvert.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationConvert.createMessage(context, args);
  }
}
