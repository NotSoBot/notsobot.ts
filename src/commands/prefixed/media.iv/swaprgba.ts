import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'swaprgba';

export default class SwapRGBACommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Swap an Image or Video RGBA channels around',
        examples: [
          `${COMMAND_NAME} @notsobot rrba`,
          `${COMMAND_NAME} @notsobot 0g0a`,
        ],
        id: Formatter.Commands.MediaIVManipulationSwapRGBA.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <channels:string>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'channels', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSwapRGBA.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSwapRGBA.createMessage(context, args);
  }
}
