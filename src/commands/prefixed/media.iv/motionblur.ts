import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'motionblur';

export default class MotionBlurCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {aliases: ['s'], name: 'strength', type: Number},
        {aliases: ['v'], name: 'vertical', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Apply a Motion Blur to an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -strength 40`,
        ],
        id: Formatter.Commands.MediaIVManipulationMotionBlur.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-strength <number>) (-vertical)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationMotionBlur.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMotionBlur.createMessage(context, args);
  }
}
