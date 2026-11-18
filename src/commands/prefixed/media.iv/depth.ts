import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaDepthColormaps } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'depth';

export default class DepthCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['depthmap'],

      args: [
        {name: 'colormap', aliases: ['c'], type: Parameters.oneOf({choices: MediaDepthColormaps}), metadata: {description: 'gray, inferno, magma, plasma, turbo or viridis'}},
        {name: 'invert', aliases: ['i'], type: Boolean, metadata: {description: 'far bright instead of near'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Show an Image or Video\'s estimated depth: near is bright, far is dark',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -colormap turbo`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png -invert`,
        ],
        id: Formatter.Commands.MediaIVManipulationDepth.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-colormap <gray|inferno|magma|plasma|turbo|viridis>) (-invert)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDepth.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDepth.createMessage(context, args);
  }
}
