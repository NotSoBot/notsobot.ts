import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'miniature';

export default class MiniatureCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['tiltshift'],

      args: [
        {name: 'amount', aliases: ['a'], type: 'float', metadata: {description: '0.1 to 10, how much blur (2.5 by default)'}},
        {name: 'range', aliases: ['r'], type: 'float', metadata: {description: '0 to 1, how much depth around the focus stays sharp (0.15 by default)'}},
        {name: 'x', type: 'float', metadata: {description: '0 to 1, where to focus across (the middle by default)'}},
        {name: 'y', type: 'float', metadata: {description: '0 to 1, where to focus down (the middle by default)'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Tilt-shift: make an Image or Video look like a tiny model, blurred by its estimated depth with stronger colors',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -y 0.7 -amount 4`,
        ],
        id: Formatter.Commands.MediaIVManipulationDepthMiniature.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <float>) (-range <float>) (-x <float>) (-y <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDepthMiniature.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDepthMiniature.createMessage(context, args);
  }
}
