import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaStereoTypes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'stereo';

export default class StereoCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['anaglyph'],

      args: [
        {name: 'amount', aliases: ['a'], type: 'float', metadata: {description: '0.5 to 10, how strong the 3D is, a percent of the width (3 by default)'}},
        {name: 'type', aliases: ['t'], type: Parameters.oneOf({choices: MediaStereoTypes}), metadata: {description: 'anaglyph (red/cyan), sidebyside, crosseye, wiggle or magiceye'}},
        {name: 'x', type: 'float', metadata: {description: '0 to 1, the point at the screen across (the subject by default)'}},
        {name: 'y', type: 'float', metadata: {description: '0 to 1, the point at the screen down (the subject by default)'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make an Image or Video stereo 3D from its estimated depth: red/cyan anaglyph, side by side, cross-eye, wigglegram or magic eye',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png -type wiggle`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -type magiceye`,
        ],
        id: Formatter.Commands.MediaIVManipulationDepthStereo.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <float>) (-type <anaglyph|crosseye|magiceye|sidebyside|wiggle>) (-x <float>) (-y <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDepthStereo.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDepthStereo.createMessage(context, args);
  }
}
