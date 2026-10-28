import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'snipframes';

export default class SnipFramesCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Snip the frames of an Animated Image/Video',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 10 50`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -50`,
        ],
        id: Formatter.Commands.MediaIVManipulationSnipFrames.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <start,number> <end,number>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'start', default: 0, type: Number},
        {name: 'end', default: 0, type: Number},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationSnipFrames.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSnipFrames.createMessage(context, args);
  }
}
