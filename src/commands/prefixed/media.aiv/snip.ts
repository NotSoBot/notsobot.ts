import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'snip';

export default class SnipCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'audio', aliases: ['a'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Cut out the part of an Animated Image/Audio/Video between two times',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 2 6`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 -4`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -4 -audio`,
        ],
        id: Formatter.Commands.MediaAIVManipulationSnip.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <start,number> <end,number> (-audio)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'start', default: 0, type: Parameters.secondsWithOptions({negatives: true})},
        {name: 'end', default: 0, type: Parameters.secondsWithOptions({negatives: true})},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationSnip.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationSnip.createMessage(context, args);
  }
}
