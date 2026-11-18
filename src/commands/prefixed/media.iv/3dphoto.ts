import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaParallaxMotions } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = '3dphoto';

export default class ThreeDPhotoCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['parallax', '3d'],

      args: [
        {name: 'amount', aliases: ['a'], type: 'float', metadata: {description: '0.5 to 10, how far the nearest things move, a percent of the size (3 by default)'}},
        {name: 'duration', aliases: ['d'], type: 'float', metadata: {description: '1 to 10 seconds a loop takes (3 by default)'}},
        {name: 'motion', aliases: ['m'], type: Parameters.oneOf({choices: MediaParallaxMotions}), metadata: {description: 'circle, sway or zoom'}},
        {name: 'x', type: 'float', metadata: {description: '0 to 1, the point that stays put across (the subject by default)'}},
        {name: 'y', type: 'float', metadata: {description: '0 to 1, the point that stays put down (the subject by default)'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make a 3D photo: the camera moves a little around an Image or Video by its estimated depth (stills become a looping GIF)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png -motion sway`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -motion zoom -amount 5`,
        ],
        id: Formatter.Commands.MediaIVManipulationDepthParallax.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <float>) (-duration <float>) (-motion <circle|sway|zoom>) (-x <float>) (-y <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDepthParallax.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDepthParallax.createMessage(context, args);
  }
}
