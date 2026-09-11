import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'reverse';

export default class ReverseCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'noaudio', aliases: ['na'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Reverse an animated image/audio/video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg`,
        ],
        id: Formatter.Commands.MediaAIVManipulationReverse.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-noaudio)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationReverse.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationReverse.createMessage(context, args);
  }
}
