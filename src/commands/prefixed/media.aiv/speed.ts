import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'speed';

export default class SpeedCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'pitch', aliases: ['usepitch'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Edit an Animated Image/Audio/Video\'s Speed',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 0.5`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 1.5 -pitch`,
        ],
        id: Formatter.Commands.MediaAIVManipulationSpeed.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<speed multiplier:float> (-pitch)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'speed', consume: true, type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationSpeed.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationSpeed.createMessage(context, args);
  }
}
