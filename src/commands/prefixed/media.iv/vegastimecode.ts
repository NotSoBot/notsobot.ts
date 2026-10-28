import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'vegastimecode';

export default class VegasTimecodeCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['timecode'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Burn an Image or Video\'s running time onto it in a black box, like VEGAS\' (Sony) Timecode',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} left top film`,
          `${COMMAND_NAME} notsobot center bottom frames`,
        ],
        id: Formatter.Commands.MediaIVManipulationTimecodeVegas.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<x:left|center|right> ?<y:top|center|bottom> ?<type:time|seconds|timeframes|frames|feet16|feet35|ivtc|film|ebu|nondrop|drop|smpte30>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'x', type: (value: string) => value || undefined},
        {name: 'y', type: (value: string) => value || undefined},
        {name: 'type', type: (value: string) => value || undefined},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationTimecodeVegas.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationTimecodeVegas.createMessage(context, args);
  }
}
