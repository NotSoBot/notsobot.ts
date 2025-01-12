import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaSlideDirections } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'slide';

export default class SlideCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'direction', aliases: ['d'], type: Parameters.oneOf({choices: MediaSlideDirections})},
        {name: 'speed', aliases: ['s'], type: 'float'},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Apply a Sliding Effect to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -speed 0.5`,
        ],
        id: Formatter.Commands.MediaIVManipulationSlide.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-direction <MediaSlideDirections>) (-speed <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSlide.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSlide.createMessage(context, args);
  }
}
