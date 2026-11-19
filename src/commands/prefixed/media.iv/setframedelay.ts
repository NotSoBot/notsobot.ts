import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'setframedelay';

export default class SetFrameDelayCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['setdelay'],

      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Set how long every frame of an Animated Image or Video is shown, in milliseconds',
        examples: [
          `${COMMAND_NAME} 20`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 200`,
        ],
        id: Formatter.Commands.MediaIVManipulationSetFrameDelay.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <milliseconds:number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'delay', consume: true, type: Number},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSetFrameDelay.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSetFrameDelay.createMessage(context, args);
  }
}
