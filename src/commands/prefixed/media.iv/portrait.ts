import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'portrait';

export default class PortraitCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['bokeh', 'dof'],

      args: [
        {name: 'amount', aliases: ['a'], type: 'float', metadata: {description: '0.1 to 10, the most blur, a percent of the size (2.5 by default)'}},
        {name: 'range', aliases: ['r'], type: 'float', metadata: {description: '0 to 1, how much depth around the focus stays sharp (0.15 by default)'}},
        {name: 'x', type: 'float', metadata: {description: '0 to 1, where to focus across (the subject by default)'}},
        {name: 'y', type: 'float', metadata: {description: '0 to 1, where to focus down (the subject by default)'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Portrait mode: blur an Image or Video\'s background (and foreground) by its estimated depth, keeping the subject sharp',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -amount 5`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -x 0.5 -y 0.8 -range 0.05`,
        ],
        id: Formatter.Commands.MediaIVManipulationDepthBlur.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <float>) (-range <float>) (-x <float>) (-y <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDepthBlur.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDepthBlur.createMessage(context, args);
  }
}
